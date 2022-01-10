const callbacks = {};

self.onmessage = (e) => {
  console.log("service worker receive message", e.data);
  const data = e.data;
  if (!data.requestId) {
    console.log("receive invalid message");
    return;
  }

  const { requestId, result, error } = data;
  if (!callbacks[requestId]) {
    console.log("invalid requestId", requestId);
    return;
  }

  const callback = callbacks[requestId];
  callback({ result, error });
  delete callbacks[requestId];
};

function generateRequestId() {
  return Date.now() + "" + Math.floor(Math.random() * 1000000);
}

async function sendToMainThread({ message, params, callback }) {
  const requestId = generateRequestId();
  callbacks[requestId] = callback;
  const client = [...(await self.clients.matchAll())].sort((a, b) =>
    a.url > b.url ? -1 : a.url < b.url ? 1 : 0
  )[0];
  client.postMessage({
    requestId,
    message,
    params,
  });
}

self.onfetch = (event) => {
  const req = event.request;
  const pathname = new URL(req.url).pathname;
  if (pathname.endsWith("worker-main-proxy")) {
    event.respondWith(
      new Promise(async (resolve, reject) => {
        const body = await req.clone().json();
        sendToMainThread({
          message: body.message,
          params: body.params || {},
          callback: ({ result, error }) => {
            if (error) {
              reject(error);
              return;
            }
            const headers = {
              "content-type": "application/json",
              "Cache-Control": "no-store",
            };
            resolve(
              new Response(JSON.stringify(result), {
                headers,
              })
            );
          },
        });
      })
    );
  }
};
