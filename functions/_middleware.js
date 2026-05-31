export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === "www.whiskersandwagsms.com") {
    url.hostname = "whiskersandwagsms.com";
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
