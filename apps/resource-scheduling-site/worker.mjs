function indexRequestFor(pathname, request) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url.toString(), request);
}

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return env.ASSETS.fetch(indexRequestFor('/index.html', request));
    }

    if (url.pathname === '/staffing' || url.pathname === '/staffing/') {
      return env.ASSETS.fetch(indexRequestFor('/staffing/index.html', request));
    }

    if (url.pathname === '/staffing/docs' || url.pathname === '/staffing/docs/') {
      return env.ASSETS.fetch(indexRequestFor('/staffing/docs.html', request));
    }

    if (url.pathname === '/batch-flow' || url.pathname === '/batch-flow/') {
      return env.ASSETS.fetch(indexRequestFor('/batch-flow/index.html', request));
    }

    if (url.pathname === '/batch-flow/docs' || url.pathname === '/batch-flow/docs/') {
      return env.ASSETS.fetch(indexRequestFor('/batch-flow/generated-docs/index.html', request));
    }

    return env.ASSETS.fetch(request);
  },
};
