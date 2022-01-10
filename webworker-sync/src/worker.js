function requestToServiceWorker({ message, params }) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "worker-main-proxy", false);
  xhr.send(
    JSON.stringify({
      message,
      params,
    })
  );
  return JSON.parse(xhr.responseText);
}

function getWindowTitle() {
  return requestToServiceWorker({
    message: "getWindowTitle",
    params: {},
  });
}

(async function main() {
  const title = await getWindowTitle();
  console.log("title is", title);
})();
