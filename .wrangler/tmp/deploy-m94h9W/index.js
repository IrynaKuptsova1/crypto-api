var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index2 = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index2) {
        throw new Error("next() called multiple times");
      }
      index2 = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
}, "bufferToFormData");

// node_modules/hono/dist/utils/body.js
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index2) => {
    if (index2 === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index2) => {
    const mark = `@${index2}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str, "tryDecodeURIComponent");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return tryDecodeURIComponent(value);
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = tryDecodeURIComponent(value);
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    for (const anyCachedKey in bodyCache) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text2) => JSON.parse(text2));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    ;
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) {
        if (key === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) {
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
        }
      }
      if (responseHeaders) {
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string") {
            responseHeaders.set(k, v);
          } else {
            responseHeaders.delete(k);
            for (const v2 of v) {
              responseHeaders.append(k, v2);
            }
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text2, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text2) : this.#newResponse(
      text2,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} env - env Object
   * @param {ExecutionContext} executionCtx - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index2 = match3.indexOf("", 1);
    return [matcher[1][index2], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return b === TAIL_WILDCARD_REG_EXP_STR ? -1 : 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  // handler index of a dynamic path, or -1 for a static path terminal
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index2, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : null : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
        if (name && pattern[2]) {
          if (regexpStr === ".*") {
            throw PATH_ERROR;
          }
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) {
            throw PATH_ERROR;
          }
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) {
            throw PATH_ERROR;
          }
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ONLY_WILDCARD_REG_EXP_STR && regexpStr !== TAIL_WILDCARD_REG_EXP_STR) {
            for (const k in node.#children) {
              if (
                // a single-char pattern coexists with single-char literals as a literal does
                (regexpStr.length > 1 || k.length > 1) && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
              ) {
                throw PATH_ERROR;
              }
            }
          }
          nextNode = node.#children[regexpStr] = new _Node();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) {
            if (k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR) {
              throw PATH_ERROR;
            }
          }
          nextNode = node.#children[token] = new _Node();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) {
      throw PATH_ERROR;
    }
    node.#index = isStatic ? -1 : index2;
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  // dynamic path -> [handler index, param assoc]; static paths are not registered
  paths = /* @__PURE__ */ Object.create(null);
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#tries = { [METHOD_NAME_ALL]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      Object.keys(middleware).forEach((m) => {
        if ((method === METHOD_NAME_ALL || method === m) && !middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        }
      });
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          if (!routes[m][path2]) {
            this.#insertPath(m, path2);
            routes[m][path2] = [
              ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
            ];
          }
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = this.#tries = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = /* @__PURE__ */ Object.create(null);
    const handlerData = [];
    [middleware, routes].forEach((r) => {
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
          continue;
        }
        const paramAssoc = pathData[1];
        handlerData[pathData[0]] = handlers.map(([h, paramCount]) => {
          const paramIndexMap = /* @__PURE__ */ Object.create(null);
          paramCount -= 1;
          for (; paramCount >= 0; paramCount--) {
            const [key, value] = paramAssoc[paramCount];
            paramIndexMap[key] = value;
          }
          return [h, paramIndexMap];
        });
      }
    });
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (let i = 0, len = handlerData.length; i < len; i++) {
      for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
        const map = handlerData[i][j]?.[1];
        if (!map) {
          continue;
        }
        const keys = Object.keys(map);
        for (let k = 0, len3 = keys.length; k < len3; k++) {
          map[keys[k]] = paramReplacementMap[map[keys[k]]];
        }
      }
    }
    const handlerMap = [];
    for (const i in indexReplacementMap) {
      handlerMap[i] = handlerData[indexReplacementMap[i]];
    }
    return [regexp, handlerMap, staticMap];
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "QUERY"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(",").map((h) => h.trim());
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// symbols/coinbase_symbols.json
var coinbase_symbols_default = [
  "00",
  "1INCH",
  "2Z",
  "A8",
  "AAVE",
  "ABT",
  "ACH",
  "ACS",
  "ACX",
  "ADA",
  "AERGO",
  "AERO",
  "AGLD",
  "AI",
  "AIOZ",
  "AKT",
  "ALCX",
  "ALEO",
  "ALEPH",
  "ALGO",
  "ALICE",
  "ALLO",
  "ALT",
  "AMP",
  "ANKR",
  "ANT",
  "APE",
  "API3",
  "APR",
  "APT",
  "ARB",
  "ARKM",
  "ARPA",
  "ARX",
  "ASM",
  "AST",
  "ASTER",
  "ATA",
  "ATH",
  "ATOM",
  "AUCTION",
  "AUD",
  "AUDD",
  "AUDIO",
  "AURORA",
  "AVAX",
  "AVNT",
  "AVT",
  "AWE",
  "AXL",
  "AXS",
  "AZTEC",
  "B3",
  "BADGER",
  "BAL",
  "BAND",
  "BARD",
  "BASED1",
  "BAT",
  "BCH",
  "BEAM",
  "BERA",
  "BICO",
  "BIGTIME",
  "BILL",
  "BIO",
  "BIRB",
  "BIT",
  "BLAST",
  "BLEND",
  "BLUR",
  "BLZ",
  "BNB",
  "BNKR",
  "BNT",
  "BOBA",
  "BOBBOB",
  "BOND",
  "BONK",
  "BREV",
  "BRL",
  "BTC",
  "BTRST",
  "BUSD",
  "C98",
  "CAD",
  "CAKE",
  "CAP",
  "CBETH",
  "CELR",
  "CFG",
  "CGLD",
  "CHECK",
  "CHF",
  "CHIP",
  "CHZ",
  "CLANKER",
  "CLV",
  "COMP",
  "COOKIE",
  "CORECHAIN",
  "COSMOSDYDX",
  "COTI",
  "COVAL",
  "COW",
  "CRO",
  "CRPT",
  "CRV",
  "CTR",
  "CTSI",
  "CTX",
  "CVC",
  "CVX",
  "DAI",
  "DAR",
  "DASH",
  "DBR",
  "DDX",
  "DEEP",
  "DEGEN",
  "DESO",
  "DEXT",
  "DIA",
  "DIEM",
  "DIMO",
  "DNT",
  "DOGE",
  "DOGINME",
  "DOLO",
  "DOOD",
  "DOT",
  "DREP",
  "DRIFT",
  "DRV",
  "DYP",
  "EDGE",
  "EDGEX",
  "EGLD",
  "EIGEN",
  "ELA",
  "ELSA",
  "ENA",
  "ENJ",
  "ENS",
  "EOS",
  "ERA",
  "ERN",
  "ESP",
  "ETC",
  "ETH",
  "ETHFI",
  "EUL",
  "EUR",
  "EURC",
  "FAI",
  "FARM",
  "FARTCOIN",
  "FET",
  "FIDA",
  "FIGHT",
  "FIL",
  "FIS",
  "FLOCK",
  "FLOKI",
  "FLOW",
  "FLR",
  "FLUID",
  "FORT",
  "FORTH",
  "FOX",
  "FUN1",
  "FX",
  "G",
  "GAL",
  "GALA",
  "GBP",
  "GEOD",
  "GFI",
  "GHST",
  "GIGA",
  "GLM",
  "GMT",
  "GNO",
  "GNT",
  "GODS",
  "GROVE",
  "GRT",
  "GRVT",
  "GST",
  "GTC",
  "GUSD",
  "GWEI",
  "GYEN",
  "HBAR",
  "HFT",
  "HIGH",
  "HNT",
  "HOME",
  "HONEY",
  "HOPR",
  "HYPE",
  "HYPER",
  "ICNT",
  "ICP",
  "IDEX",
  "ILV",
  "IMU",
  "IMX",
  "INDEX",
  "INJ",
  "INR",
  "INV",
  "INX",
  "IO",
  "IOTX",
  "IP",
  "IRYS",
  "JASMY",
  "JITOSOL",
  "JTO",
  "JUP",
  "JUPITER",
  "KAIO",
  "KAITO",
  "KARRAT",
  "KAT",
  "KAVA",
  "KEEP",
  "KERNEL",
  "KEYCAT",
  "KITE",
  "KMNO",
  "KNC",
  "KRL",
  "KSM",
  "KTA",
  "L3",
  "LA",
  "LAYER",
  "LCX",
  "LDO",
  "LIGHTER",
  "LINEA",
  "LINK",
  "LIT",
  "LMTS",
  "LOKA",
  "LOOM",
  "LPT",
  "LQTY",
  "LRC",
  "LRDS",
  "LSETH",
  "LTC",
  "MAGIC",
  "MAMO",
  "MANA",
  "MANTLE",
  "MASK",
  "MATH",
  "MATIC",
  "MCO2",
  "MDT",
  "ME",
  "MEDIA",
  "MEGA",
  "MET",
  "META",
  "METIS",
  "MEZO",
  "MINA",
  "MIR",
  "MKR",
  "MLN",
  "MNDE",
  "MOBILE",
  "MOG",
  "MON",
  "MONA",
  "MOODENG",
  "MORPHO",
  "MOVE",
  "MPL",
  "MPLX",
  "MSOL",
  "MTL",
  "MULTI",
  "MUSD",
  "MUSE",
  "MXC",
  "NCT",
  "NEAR",
  "NEON",
  "NEST",
  "NEWT",
  "NEX",
  "NKN",
  "NMR",
  "NOICE",
  "NOM",
  "NU",
  "O",
  "OCEAN",
  "OGN",
  "OMG",
  "OMNI",
  "ONDO",
  "ONED",
  "OOKI",
  "OP",
  "OPG",
  "OPN",
  "ORCA",
  "ORN",
  "OSMO",
  "OXT",
  "PAX",
  "PAXG",
  "PENDLE",
  "PENGU",
  "PEPE",
  "PERP",
  "PIRATE",
  "PLA",
  "PLU",
  "PLUME",
  "PNG",
  "PNUT",
  "POL",
  "POLS",
  "POLY",
  "POND",
  "POPCAT",
  "POWR",
  "PRCL",
  "PRIME",
  "PRL",
  "PRO",
  "PROMPT",
  "PROS",
  "PROVE",
  "PRQ",
  "PUMP",
  "PUNDIX",
  "PYR",
  "PYTH",
  "PYUSD",
  "QI",
  "QNT",
  "QSP",
  "QUICK",
  "RAD",
  "RAI",
  "RARE",
  "RARI",
  "RAVE",
  "RAY",
  "RBN",
  "RE",
  "RECALL",
  "RED",
  "REN",
  "RENDER",
  "REP",
  "REQ",
  "REZ",
  "RGT",
  "RLC",
  "RLS",
  "RLY",
  "RNBW",
  "RNDR",
  "ROBO",
  "RONIN",
  "ROSE",
  "RPL",
  "RSC",
  "RSR",
  "S",
  "SAFE",
  "SAND",
  "SAPIEN",
  "SD",
  "SEAM",
  "SEI",
  "SENT",
  "SGD",
  "SHDW",
  "SHIB",
  "SHPING",
  "SIGN",
  "SKL",
  "SKR",
  "SKY",
  "SNT",
  "SNX",
  "SOL",
  "SPA",
  "SPELL",
  "SPK",
  "SPX",
  "SQD",
  "STG",
  "STORJ",
  "STRK",
  "STX",
  "SUI",
  "SUKU",
  "SUP",
  "SUPER",
  "SUSHI",
  "SWELL",
  "SWFTC",
  "SXT",
  "SYLO",
  "SYN",
  "SYND",
  "SYRUP",
  "T",
  "TAO",
  "TBTC",
  "TGBP",
  "THQ",
  "TIA",
  "TIME",
  "TNSR",
  "TON",
  "TONE",
  "TOSHI",
  "TOWNS",
  "TRAC",
  "TRB",
  "TREE",
  "TRIA",
  "TRIBE",
  "TROLL",
  "TRU",
  "TRUMP",
  "TRUST",
  "TURBO",
  "TVK",
  "UMA",
  "UNFI",
  "UNI",
  "UP",
  "UPI",
  "USD",
  "USD1",
  "USDC",
  "USDF",
  "USDS",
  "USDT",
  "USELESS",
  "UST",
  "VARA",
  "VELO",
  "VET",
  "VGX",
  "VIRTUAL",
  "VOXEL",
  "VTHO",
  "VVV",
  "W",
  "WAL",
  "WAMPL",
  "WAXL",
  "WBTC",
  "WCFG",
  "WCT",
  "WELL",
  "WET",
  "WIF",
  "WLD",
  "WLFI",
  "WLUNA",
  "WMTX",
  "WRON",
  "XAN",
  "XCN",
  "XLM",
  "XMON",
  "XPL",
  "XRP",
  "XSGD",
  "XTZ",
  "XYO",
  "YB",
  "YFI",
  "YFII",
  "ZAMA",
  "ZEC",
  "ZEN",
  "ZETA",
  "ZETACHAIN",
  "ZK",
  "ZKC",
  "ZKP",
  "ZORA",
  "ZRO",
  "ZRX"
];

// symbols/cmc_symbols.json
var cmc_symbols_default = [
  "BTC",
  "LTC",
  "NMC",
  "TRC",
  "PPC",
  "NVC",
  "FTC",
  "FRC",
  "IXC",
  "DGC",
  "LKY",
  "GLC",
  "JKC",
  "PXC",
  "XPM",
  "CSC",
  "XRP",
  "ZET",
  "TAG",
  "UNO",
  "DEM",
  "DOGE",
  "DMD",
  "HBN",
  "42",
  "VTC",
  "DGB",
  "RDD",
  "POT",
  "MAX",
  "DASH",
  "XCP",
  "AUR",
  "MARS",
  "MIM",
  "MAZA",
  "BLK",
  "MONA",
  "EFL",
  "GRS",
  "XPD",
  "PLNC",
  "XWC",
  "BITS",
  "QBC",
  "BLU",
  "XBC",
  "DRM",
  "XMR",
  "MOTO",
  "CLOAK",
  "C2",
  "BCN",
  "NAV",
  "START",
  "XDN",
  "CLAM",
  "BTS",
  "VIA",
  "XCN",
  "CARBON",
  "CANN",
  "XLM",
  "SYS",
  "EMC",
  "RBBT",
  "OPAL",
  "ACOIN",
  "TROLL",
  "BSTY",
  "PXI",
  "XVG",
  "SPR",
  "RBT",
  "BLOCK",
  "CRW",
  "XQN",
  "XPY",
  "COVAL",
  "KOBO",
  "BITB",
  "USDT",
  "WBB",
  "SONG",
  "XEM",
  "CF",
  "BUB",
  "UNIT",
  "PKB",
  "ARB",
  "BTA",
  "ADC",
  "SNRG",
  "XRA",
  "CREVA",
  "BSC",
  "MANNA",
  "AXIOM",
  "ETH",
  "TX",
  "GCC",
  "AMS",
  "AGRS",
  "EUC",
  "SC",
  "VEC2",
  "PAK",
  "SIB",
  "SWING",
  "SANDG",
  "REP",
  "DFT",
  "CLUB",
  "ADZ",
  "AV",
  "VAL",
  "LTCR",
  "SLS",
  "FRN",
  "EVIL",
  "DCR",
  "PIVX",
  "RBIES",
  "FREED",
  "MEME",
  "IMS",
  "NEVA",
  "PEX",
  "CAB",
  "MOJO",
  "LSK",
  "EDRC",
  "POST",
  "BERN",
  "STEEM",
  "XHI",
  "XBTC21",
  "2GIVE",
  "XPTX",
  "LANA",
  "PONZI",
  "WAVES",
  "ION",
  "HVCO",
  "GB",
  "CMT",
  "CHESS",
  "CJ",
  "SBD",
  "ARDR",
  "ETC",
  "STRAX",
  "ACES",
  "TAJ",
  "VLT",
  "NEO",
  "NLC",
  "ZYD",
  "PLU",
  "DLC",
  "MST",
  "FIRO",
  "ZEC",
  "ASAFE",
  "ZCL",
  "GLM",
  "KURT",
  "ENT",
  "GBYTE",
  "POSW",
  "WINGS",
  "JUP",
  "ALIAS",
  "VIDZ",
  "ICOB",
  "IBANK",
  "MKR",
  "KMD",
  "FRST",
  "ICON",
  "CNT",
  "MLN",
  "TIME",
  "ARGUS",
  "SWT",
  "XNO",
  "NETKO",
  "ARK",
  "SKY",
  "BLAZR",
  "ZENI",
  "CXT",
  "CONX",
  "RLC",
  "TRST",
  "SCS",
  "BTX",
  "VOLT",
  "LUN",
  "GNO",
  "TKN",
  "HMQ",
  "ANT",
  "PZM",
  "QTUM",
  "MAY",
  "BAT",
  "ZEN",
  "AE",
  "VERI",
  "QRL",
  "IOTA",
  "MYST",
  "MORE",
  "BNT",
  "NMR",
  "UNIFY",
  "ONX",
  "FUN",
  "SNT",
  "ERG",
  "EOS",
  "ADX",
  "STORJ",
  "SOCC",
  "WGR",
  "PLBT",
  "GAS",
  "SNC",
  "MTL",
  "PPT",
  "OMG",
  "MRX",
  "CVC",
  "VGX",
  "PART",
  "SMART",
  "BCH",
  "PLR",
  "BNB",
  "GSR",
  "DNT",
  "SHDW",
  "ONION",
  "ADS",
  "DENT",
  "IFT",
  "TCC",
  "ZRX",
  "MYB",
  "NAS",
  "ACT",
  "LRC",
  "AVT",
  "DLT",
  "TRX",
  "BUZZ",
  "MANA",
  "IND",
  "ATB",
  "PRO",
  "LINK",
  "SUB",
  "RVT",
  "KIN",
  "SALT",
  "COLX",
  "ADA",
  "XTZ",
  "INXT",
  "CNX",
  "BTCZ",
  "ZSC",
  "AST",
  "AION",
  "DRT",
  "REQ",
  "BLUE",
  "AMB",
  "BTG",
  "KCS",
  "NULS",
  "RCN",
  "ICX",
  "IETH",
  "ENJ",
  "POWR",
  "ATL",
  "ETN",
  "DATA",
  "PHR",
  "RDN",
  "UFR",
  "PRIX",
  "BCD",
  "VEE",
  "FLIXX",
  "DRGN",
  "PRE",
  "UQC",
  "FIL",
  "SBTC",
  "WRC",
  "GFT",
  "UBTC",
  "STMX",
  "ELF",
  "WAXP",
  "MED",
  "SRN",
  "DBC",
  "NEU",
  "UTK",
  "ONE",
  "HPY",
  "SWFTC",
  "MDT",
  "XIN",
  "POLIS",
  "ZAP",
  "AIX",
  "GOD",
  "BCA",
  "TEL",
  "WETH",
  "KEY",
  "IOST",
  "SPC",
  "ARCT",
  "THETA",
  "AGIX",
  "HOT",
  "C20",
  "CRPT",
  "TBX",
  "AID",
  "TRAC",
  "LET",
  "ZIL",
  "MAN",
  "GRLC",
  "CXO",
  "ELA",
  "POLY",
  "BORG",
  "HT",
  "DMT",
  "BLZ",
  "UCASH",
  "MNTP",
  "CAS",
  "EDGE",
  "NTK",
  "REN",
  "LCC",
  "ABT",
  "REM",
  "POA",
  "RFR",
  "TUSD",
  "STAC",
  "ONT",
  "VIC",
  "BAX",
  "TEN",
  "RVN",
  "SNX",
  "LOOM",
  "NPXS",
  "WAN",
  "MITH",
  "XBP",
  "NCT",
  "XDC",
  "CVT",
  "P2P",
  "EOSDAC",
  "AUC",
  "BUBO",
  "MFG",
  "DERO",
  "EFX",
  "FTX",
  "HOT",
  "RBLX",
  "NEXO",
  "CEL",
  "TNS",
  "AMN",
  "BOUTS",
  "ZIPT",
  "DTRC",
  "UBT",
  "MNW",
  "XYO",
  "AVA",
  "IOTX",
  "NKN",
  "SOUL",
  "SPD",
  "0xBTC",
  "QKC",
  "ABYSS",
  "CEEK",
  "XMX",
  "BOUNTY",
  "DAG",
  "MET",
  "DFT",
  "ZCN",
  "ZINC",
  "WWB",
  "MFT",
  "KBC",
  "LIKE",
  "MOC",
  "NIM",
  "OLT",
  "SUSD",
  "IQ",
  "BMX",
  "KAN",
  "CET",
  "RPL",
  "KRL",
  "MVL",
  "EURS",
  "BIFI",
  "DRC",
  "VEX",
  "VTHO",
  "PRIV",
  "ZMN",
  "FLUX",
  "BST",
  "GOC",
  "VET",
  "X8X",
  "SCR",
  "PKG",
  "XPX",
  "UBEX",
  "BAAS",
  "THR",
  "QNT",
  "ABL",
  "PMA",
  "ABX",
  "HAND",
  "RATING",
  "ONG",
  "NRG",
  "FLOT",
  "AMO",
  "MOLK",
  "GUSD",
  "SIX",
  "USDP",
  "XCASH",
  "ECOREAL",
  "FREE",
  "USDC",
  "BCZERO",
  "META",
  "SHPING",
  "RPD",
  "ABBC",
  "DIVI",
  "MMO",
  "MODX",
  "PNK",
  "XNV",
  "BSV",
  "VEST",
  "MICRO",
  "BTNTV2",
  "rBTC",
  "CRO",
  "AERGO",
  "LPT",
  "SHX",
  "HEDG",
  "XFC",
  "AWC",
  "DOGEC",
  "CENT",
  "BTB",
  "OBSR",
  "RIF",
  "BEAM",
  "ADM",
  "VSYS",
  "GRIN",
  "EQTY",
  "CAJ",
  "WBTC",
  "BTTOLD",
  "TEMCO",
  "SOLVE",
  "ECTE",
  "HXRO",
  "EVY",
  "JNB",
  "OWC",
  "PIB",
  "HBX",
  "FET",
  "COT",
  "ANKR",
  "ATOM",
  "BORA",
  "DOS",
  "CELR",
  "VRA",
  "TFUEL",
  "TOP",
  "NEX",
  "SHA",
  "ORBS",
  "BOLT",
  "MTV",
  "LOCUS",
  "AB",
  "BOTX",
  "IRIS",
  "ARQ",
  "NOW",
  "OKB",
  "AXE",
  "DIO",
  "OCEAN",
  "IDEX",
  "TT",
  "ELET",
  "SWIFT",
  "SRK",
  "ONE",
  "TERA",
  "ARRR",
  "LEO",
  "RSR",
  "BTC2",
  "CHR",
  "SCC",
  "BDX",
  "COTI",
  "ZNN",
  "AWE",
  "BTCB",
  "RAVEN",
  "DAPP",
  "MOTA",
  "ALGO",
  "HNST",
  "COS",
  "MBL",
  "ARPA",
  "MX",
  "NBOT",
  "AMPL",
  "TRV",
  "USDK",
  "CHZ",
  "SCP",
  "MPRA",
  "WXT",
  "DUSK",
  "QBX",
  "TMN",
  "XCM",
  "TKP",
  "FOR",
  "VD",
  "PROM",
  "KAON",
  "BRZ",
  "RUNE",
  "YEC",
  "RIO",
  "BTR",
  "LUNC",
  "UOS",
  "FTT",
  "SHR",
  "WIN",
  "FRM",
  "YO",
  "KLAY",
  "BTRS",
  "XTM",
  "BCNA",
  "GT",
  "SXP",
  "BF",
  "ZNZ",
  "PERL",
  "RPZX",
  "TOKO",
  "YCE",
  "EXCC",
  "TUP",
  "XDAG",
  "VAIX",
  "PIRATE",
  "EGG",
  "VOLTZ",
  "CNHt",
  "FLOW",
  "XDB",
  "JFIN",
  "HBAR",
  "TLOS",
  "BAND",
  "BUSD",
  "ZANO",
  "IDRT",
  "BXC",
  "BAN",
  "PAXG",
  "CERE",
  "VLX",
  "XRT",
  "DF",
  "NU",
  "AZ",
  "ROOBEE",
  "CTK",
  "BCNT",
  "WIKEN",
  "XBT",
  "KAVA",
  "STX",
  "LINKA",
  "MERGE",
  "UCX",
  "GRG",
  "DAI",
  "TRB",
  "CKB",
  "LCX",
  "ZYN",
  "FCT",
  "MAPO",
  "ARDX",
  "ARX",
  "TROY",
  "HEX",
  "ALTS",
  "JADE",
  "OXT",
  "MWC",
  "KSM",
  "VRSC",
  "ANK",
  "LX",
  "MON",
  "MAX",
  "XTN",
  "XTP",
  "SURE",
  "CNB",
  "OGN",
  "DGLD",
  "MCM",
  "WRX",
  "XAUt",
  "BTCP",
  "JRT",
  "CTC",
  "GLEEC",
  "XMALL",
  "USDB",
  "HNS",
  "JUV",
  "BAR",
  "PSG",
  "ATM",
  "GAL",
  "ASR",
  "CDAI",
  "MLK",
  "EWT",
  "PCI",
  "SOLO",
  "BTSE",
  "OG",
  "ORC",
  "WOM",
  "ULT",
  "CNX",
  "CUBE",
  "XPR",
  "PEAK",
  "IBS",
  "HIVE",
  "HBD",
  "HUNT",
  "EL",
  "SCOP",
  "CLT",
  "KDG",
  "PRQ",
  "DSLA",
  "SOL",
  "DEP",
  "pBTC",
  "EPIC",
  "BIZZ",
  "CTSI",
  "LBK",
  "WBX",
  "KAI",
  "ISIKC",
  "CRDT",
  "JST",
  "SENSO",
  "MPS",
  "CHI",
  "HTR",
  "KEEP",
  "CELO",
  "HAI",
  "DXD",
  "ATT",
  "STAKE",
  "SCRT",
  "SSG",
  "ZLW",
  "MATH",
  "UMA",
  "KDAG",
  "ORN",
  "AR",
  "FUSE",
  "PXP",
  "KDA",
  "SYLO",
  "HNT",
  "BGL",
  "RENDER",
  "SKL",
  "COMP",
  "BAL",
  "MUSD",
  "MTA",
  "RENBTC",
  "CBP",
  "PNT",
  "RING",
  "TRCL",
  "DFI",
  "AVAX",
  "ALEPH",
  "SLP",
  "SWAP",
  "IDNA",
  "QANX",
  "YFI",
  "FIO",
  "DEXT",
  "RARI",
  "FIS",
  "FRONT",
  "CSPR",
  "NVT",
  "DKA",
  "MTRG",
  "PKOIN",
  "ZOOM",
  "KTON",
  "WNXM",
  "TPT",
  "MCB",
  "YFII",
  "TWT",
  "SHIB",
  "XT",
  "ASM",
  "DIA",
  "SUKU",
  "SRM",
  "CREAM",
  "GEEQ",
  "SAND",
  "ARCONA",
  "BTY",
  "SG",
  "DEC",
  "BLY",
  "FSCC",
  "HIBS",
  "ITAM",
  "MTC",
  "TFT",
  "STRONG",
  "HOPR",
  "NEAR",
  "OM",
  "RFUEL",
  "CRV",
  "GHX",
  "DIP",
  "SBET",
  "ANG",
  "HAKKA",
  "MTR",
  "DOT",
  "LAYER",
  "AHT",
  "USDF",
  "CVP",
  "WHALE",
  "POX",
  "OCP",
  "SPA",
  "GRT",
  "KLV",
  "TOKAMAK",
  "CHAIN",
  "CRU",
  "CFG",
  "HDX",
  "ACA",
  "SUSHI",
  "DUST",
  "FXC",
  "AXS",
  "BCUG",
  "LIT",
  "GLMR",
  "NODL",
  "PHA",
  "RAD",
  "FARM",
  "CRP",
  "LIVE",
  "TON",
  "SHROOM",
  "EGLD",
  "JFI",
  "BNSD",
  "BEL",
  "HEGIC",
  "KEX",
  "NCDT",
  "YF-DAI",
  "HBTC",
  "JGN",
  "AMP",
  "HGET",
  "PERP",
  "REEF",
  "FRAX",
  "FRAX",
  "ACH",
  "G$",
  "SPARTA",
  "REVV",
  "TXL",
  "ESD",
  "GOF",
  "GHST",
  "WING",
  "DPI",
  "BAKE",
  "UP",
  "GALA",
  "UNI",
  "DEGO",
  "DHT",
  "BRG",
  "LINA",
  "ASK",
  "ACPT",
  "VELO",
  "USTC",
  "FLM",
  "BURGER",
  "BHC",
  "KOGE",
  "CAKE",
  "OUSD",
  "WBNB",
  "BID",
  "POLS",
  "RBC",
  "DODO",
  "INJ",
  "DDX",
  "GEL",
  "OPIUM",
  "ALPHA",
  "CUSD",
  "CORE",
  "STBU",
  "MTLX",
  "APE",
  "XDNA",
  "SFD",
  "AAVE",
  "XPRT",
  "XVS",
  "TRU",
  "BIFI",
  "DEXE",
  "CFX",
  "INDEX",
  "CNTR",
  "MOON",
  "EYE",
  "DRC",
  "PLOT",
  "HEZ",
  "LQTY",
  "AKT",
  "ZEE",
  "BOND",
  "AUDIO",
  "AQT",
  "PDA",
  "RAMP",
  "POND",
  "WOO",
  "EVER",
  "QRX",
  "ORAI",
  "KP3R",
  "WEMIX",
  "HYVE",
  "eRSDL",
  "DOC",
  "DVI",
  "SMARTCREDIT",
  "LTX",
  "SFI",
  "ALPA",
  "BCA",
  "UBX",
  "TH",
  "TRA",
  "AZUKI",
  "ROSE",
  "RFOX",
  "UNCX",
  "UNFI",
  "ROOK",
  "EXRD",
  "CORX",
  "MVC",
  "XKR",
  "TRU",
  "ICHI",
  "API3",
  "KIT",
  "POLA",
  "MPH",
  "EDEN",
  "BFHT",
  "SC",
  "BLINK",
  "BUNNY",
  "BIRD",
  "MUSE",
  "BAC",
  "BFC",
  "VAI",
  "BASE",
  "IDLE",
  "MIR",
  "BADGER",
  "MONA",
  "VAL",
  "MOB",
  "WOZX",
  "BONDLY",
  "FLR",
  "vSXP",
  "vUSDT",
  "vUSDC",
  "vBUSD",
  "vXVS",
  "vBNB",
  "vBTC",
  "vETH",
  "vLTC",
  "vXRP",
  "HNY",
  "vBCH",
  "vLINK",
  "vDOT",
  "FIDA",
  "HUB",
  "SZCB",
  "LDO",
  "DFIAT",
  "OXY",
  "BIOT",
  "VANRY",
  "ADP",
  "TORN",
  "UNN",
  "DUCK",
  "RLY",
  "DYP",
  "LON",
  "stETH",
  "ankrETH",
  "1INCH",
  "CBK",
  "YDA",
  "SFP",
  "FIRE",
  "BIFI",
  "SKEY",
  "OVR",
  "AME",
  "MAPS",
  "WISE",
  "BAO",
  "FOX",
  "QUICK",
  "vFIL",
  "vDAI",
  "XEP",
  "AIN",
  "HYDRA",
  "3CRV",
  "PROS",
  "COMBO",
  "NDX",
  "HELMET",
  "MDX",
  "POOLX",
  "ARIA20",
  "NGM",
  "KOIN",
  "SUPER",
  "SDT",
  "MDX",
  "XFUND",
  "BETH",
  "BITCI",
  "BMI",
  "CWS",
  "VBETH",
  "MASQ",
  "AKITA",
  "CLV",
  "UMB",
  "GUM",
  "AUTO",
  "BAMBOO",
  "ANI",
  "YFO",
  "RAZOR",
  "MFI",
  "APYS",
  "DAO",
  "PNG",
  "JASMY",
  "HOGE",
  "ETHIX",
  "GFARM2",
  "SGT",
  "WILC",
  "EGG",
  "B20",
  "NUX",
  "VAI",
  "TBCC",
  "XSGD",
  "ID",
  "BANANA",
  "LPNT",
  "POOL",
  "XMON",
  "RWA",
  "RAI",
  "RAY",
  "CHEX",
  "MASK",
  "CAN",
  "ACM",
  "POLC",
  "PRCY",
  "KEYFI",
  "HAPI",
  "GRAPE",
  "VISTA",
  "POLK",
  "AUCTION",
  "TUNE",
  "WOW",
  "DMC",
  "ALCX",
  "ALUSD",
  "EPIC",
  "TOWER",
  "WATCH",
  "VBNT",
  "SLICE",
  "FEI",
  "MINA",
  "CGG",
  "BSCPAD",
  "PAR",
  "SOV",
  "VOW",
  "XYM",
  "CADC",
  "DEXTF",
  "PCNT",
  "BNC",
  "ALPACA",
  "BDP",
  "PANDO",
  "TARA",
  "ODDZ",
  "ILV",
  "INV",
  "BLUE",
  "BELT",
  "NRV",
  "ZEFI",
  "ALICE",
  "GYEN",
  "ZUSD",
  "RAM",
  "POODL",
  "MCO2",
  "BOSON",
  "PIG",
  "AUR",
  "DG",
  "CUB",
  "RAGE",
  "VBSWAP",
  "DHV",
  "ALL",
  "IBFK",
  "USDP",
  "BTCST",
  "DPR",
  "XSUSHI",
  "RENZEC",
  "BTSG",
  "STRK",
  "ICP",
  "SHFT",
  "WMATIC",
  "ATD",
  "TRIAS",
  "EPS",
  "ETNA",
  "xBLZD",
  "SAFEMARS",
  "SFUND",
  "CWIF",
  "POOCOIN",
  "WAD",
  "EFI",
  "CELL",
  "COOK",
  "BUSY",
  "AMI",
  "TKO",
  "wxDai",
  "TRIBE",
  "GLQ",
  "PUNDIX",
  "JPYC",
  "INFRA",
  "LPL",
  "OHM",
  "GOAT",
  "XCHNG",
  "ICE",
  "BOMB",
  "HUB",
  "10SET",
  "CPC",
  "GMEE",
  "AIOZ",
  "KTN",
  "PUSH",
  "TLM",
  "FLY",
  "MIST",
  "BYN",
  "PFL",
  "MBOX",
  "RVF",
  "PIT",
  "SYL",
  "QTCC",
  "OCC",
  "SAITO",
  "HORD",
  "REVO",
  "K21",
  "MVI",
  "CUMMIES",
  "MOONSTAR",
  "MIST",
  "STRX",
  "HZN",
  "SATOZ",
  "SATA",
  "XCH",
  "FOC",
  "ZIG",
  "KEL",
  "ZCX",
  "FINE",
  "BTCBAM",
  "LAUNCH",
  "IMO",
  "SMRAT",
  "MOVR",
  "LEASH",
  "QI",
  "CAPS",
  "NFTART",
  "PYR",
  "BSCS",
  "CRWNY",
  "KISHU",
  "REAU",
  "FORTH",
  "PHTR",
  "vDOGE",
  "ELON",
  "NMX",
  "STEP",
  "KNC",
  "BDT",
  "AGVE",
  "ASS",
  "XWG",
  "WAVAX",
  "CEUR",
  "SPORE",
  "PENDLE",
  "BTCT",
  "SHEESHA",
  "ELAND",
  "FLX",
  "GOZ",
  "LEG",
  "DFYN",
  "MEPAD",
  "BONFIRE",
  "PKT",
  "MEDIA",
  "BCAT",
  "GNT",
  "BICO",
  "PRARE",
  "NFTB",
  "CLS",
  "LUSD",
  "PRI",
  "O3",
  "RPTR",
  "SYA",
  "ALU",
  "SDAO",
  "PUSSY",
  "METIS",
  "DON",
  "NABOX",
  "SKILL",
  "CATE",
  "TRR",
  "LOWB",
  "WILD",
  "MCHC",
  "VRT",
  "DOGGY",
  "KABOSU",
  "LAT",
  "SAMO",
  "PINK",
  "SLIM",
  "WSB",
  "VPP",
  "STOS",
  "COP",
  "MLT",
  "SNOB",
  "ETH2X-FLI",
  "XAVA",
  "RBT",
  "NFT",
  "NAFT",
  "NSFW",
  "EMAX",
  "YUMMY",
  "SISHI",
  "ISP",
  "HOTCROSS",
  "XCAD",
  "XWIN",
  "EXO",
  "BNX",
  "YOOSHI",
  "HODL",
  "CVX",
  "RUNE",
  "SPACE",
  "ELEPHANT",
  "OOE",
  "WEX",
  "NETVR",
  "STARSHIP",
  "BLAST",
  "CORGI",
  "SLRS",
  "BEZOGE",
  "DINU",
  "AQUA",
  "USDm",
  "XMS",
  "TENFI",
  "WSG",
  "KAR",
  "MOOV",
  "EPIK",
  "CITY",
  "GTC",
  "SAFEMOONCASH",
  "NUUM",
  "POLYDOGE",
  "ELK",
  "KALM",
  "BSL",
  "LSS",
  "DUET",
  "FISH",
  "DEFX",
  "PERRY",
  "PORNROCKET",
  "SAT",
  "RABBIT",
  "GOMINING",
  "SMILEK",
  "ATA",
  "KEANU",
  "BBT",
  "STC",
  "VDR",
  "QI",
  "MIMATIC",
  "WFTM",
  "KBC",
  "CORGIB",
  "XRUNE",
  "CHEEMS",
  "ALD",
  "CATGIRL",
  "TRONPAD",
  "DAISY",
  "CVXCRV",
  "BZZ",
  "DFL",
  "ELG",
  "GFI",
  "STNK",
  "BABY",
  "HAM",
  "HMT",
  "APW",
  "APRIL",
  "CTX",
  "DXI",
  "TULIP",
  "SXC",
  "LEOPARD",
  "KUMA",
  "KOM",
  "BabyDoge",
  "OPUL",
  "HOD",
  "GINUX",
  "ALM",
  "ARG",
  "SWISE",
  "DESO",
  "SOLAPE",
  "SHILL",
  "TRADE",
  "TITAN",
  "LIME",
  "BULL",
  "SMARS",
  "HIT",
  "FLUID",
  "HUNNY",
  "WSHIB",
  "PACOCA",
  "LITH",
  "SUN",
  "CWT",
  "SKRT",
  "CNR",
  "SQT",
  "DCB",
  "TFI",
  "TABOO",
  "FLURRY",
  "IMX",
  "XCV",
  "GOG",
  "GODS",
  "BTCDOM",
  "QUACK",
  "SAFEBULL",
  "BNBTC",
  "EIFI",
  "KOGECOIN",
  "HARE",
  "KOJI",
  "OLIVE",
  "YGG",
  "MOONED",
  "KICK",
  "BMON",
  "BABI",
  "BPX",
  "UFO",
  "NT",
  "ZERC",
  "BSW",
  "AM",
  "SIGNA",
  "DINO",
  "HERO",
  "EURt",
  "XEC",
  "SAUBER",
  "HVI",
  "FLOKI",
  "PEFI",
  "STARL",
  "HTZ",
  "MIMO",
  "WSPP",
  "RAIL",
  "MM",
  "CHAINCADE",
  "AINU",
  "NEWB",
  "$DRF",
  "LIKE",
  "BRKL",
  "SRX",
  "ALT",
  "DADDYDOGE",
  "C98",
  "AIRT",
  "ZPAY",
  "IDIA",
  "BXX",
  "MCONTENT",
  "UFI",
  "CHESS",
  "MINT",
  "WITCH",
  "TKG",
  "LIQ",
  "SPADE",
  "ZOO",
  "CO",
  "WKCS",
  "KRW",
  "SPS",
  "BFG",
  "IAG",
  "BRISE",
  "ARENA",
  "BTBS",
  "EJS",
  "BGB",
  "DRIP",
  "BIRB",
  "ELCASH",
  "SPO",
  "ZOON",
  "PVU",
  "PLS",
  "ETHDYDX",
  "ORCA",
  "MNGO",
  "WLUNC",
  "SBR",
  "KCAKE",
  "LYD",
  "GOAL",
  "TOKE",
  "BLOK",
  "DXCT",
  "ATLAS",
  "POLIS",
  "BORING",
  "PORT",
  "BIT",
  "WNCG",
  "MMUI",
  "HIGH",
  "POSI",
  "HI",
  "POTS",
  "LAND",
  "DXLC",
  "COL",
  "BSR",
  "SPELL",
  "KMON",
  "RARE",
  "BETA",
  "FB",
  "CYCE",
  "DARA",
  "MATE",
  "RACA",
  "ADAPAD",
  "AURY",
  "NFD",
  "VICS",
  "D",
  "BR",
  "JOE",
  "KSHIB",
  "TAROT",
  "YAK",
  "GAJ",
  "GRAM",
  "JAM",
  "TAUR",
  "WANA",
  "VEMP",
  "CYT",
  "SCCP",
  "MSOL",
  "HUSKY",
  "CATO",
  "SOLPAD",
  "BOP",
  "WIFEDOGE",
  "CBG",
  "AMT",
  "BIT",
  "KLO",
  "EKTA",
  "VCF",
  "GALO",
  "POR",
  "AFC",
  "UFC",
  "ARV",
  "ZOO",
  "DOG",
  "AIRI",
  "ASH",
  "AGLD",
  "OVATO",
  "BTRST",
  "ALI",
  "SWT",
  "IXS",
  "REGEN",
  "WNT",
  "ELMON",
  "YAY",
  "FIWA",
  "POCO",
  "WONE",
  "LIFE",
  "COPYCAT",
  "ACT",
  "BALA",
  "BFT",
  "XAI",
  "ETERNAL",
  "BUY",
  "BIGSB",
  "EVERETH",
  "GAFI",
  "FOREX",
  "INTER",
  "DLYCOP",
  "WNEAR",
  "REF",
  "AFR",
  "WAG",
  "SMT",
  "POKT",
  "MONS",
  "Milk",
  "OP",
  "ARB",
  "GMX",
  "BONE",
  "GZONE",
  "GAL",
  "ADOGE",
  "HCT",
  "SOKU",
  "MIVA",
  "X",
  "EBA",
  "MONI",
  "THG",
  "PRT",
  "MAT",
  "XRD",
  "VEE",
  "HERA",
  "THALES",
  "AZERO",
  "RPG",
  "SUNDAE",
  "HAPPY",
  "DOGECOIN",
  "DMTR",
  "SYP",
  "LIGHT",
  "XTT-B20",
  "CRTS",
  "XLD",
  "GOLD",
  "ZKP",
  "CWEB",
  "CRYSTL",
  "POOF",
  "ORION",
  "PSB",
  "EVDC",
  "FRTS",
  "NFTD",
  "RMRK",
  "SYN",
  "SWASH",
  "KURO",
  "ASIA",
  "SOLV",
  "MOWA",
  "REVU",
  "ALPHA",
  "SGB",
  "BABYFLOKI",
  "BOSS",
  "FUFU",
  "DSFR",
  "FINA",
  "ABR",
  "OSMO",
  "DOGEGF",
  "MARS4",
  "GRAPE",
  "BCOIN",
  "WOOF",
  "CHEQ",
  "PYM",
  "ERTHA",
  "stSOL",
  "RTM",
  "NSDX",
  "JEWEL",
  "DTBX",
  "DBX",
  "SHICO",
  "WOJ",
  "YCT",
  "LOVELY",
  "RBN",
  "DUCX",
  "MTO",
  "SNFT",
  "DEL",
  "WSTETH",
  "WHACKD",
  "MRHB",
  "PLSPAD",
  "WJXN",
  "SSS",
  "SEA",
  "TIME",
  "ZEDXION",
  "EQ",
  "ARW",
  "DARK",
  "GUARD",
  "AVAI",
  "DINO",
  "GRACY",
  "EBSO",
  "TC",
  "BETA",
  "LIQ",
  "Mononoke-Inu",
  "CPOOL",
  "CZF",
  "POKERFI",
  "Liza",
  "ASPO",
  "SLB",
  "SWAY",
  "SCPT",
  "SD",
  "ALA",
  "GAIA",
  "HANU",
  "ROCO",
  "LAZIO",
  "WPKT",
  "PKN",
  "NINJA",
  "GYRO",
  "CWAR",
  "PULSE",
  "ORE",
  "NAKA",
  "INF",
  "FODL",
  "XTAG",
  "CLY",
  "MIN",
  "IOEN",
  "DVK",
  "SIN",
  "DESU",
  "MECH",
  "GFN",
  "BODAV2",
  "DOBO",
  "KLIMA",
  "ASTR",
  "SQD",
  "UBI",
  "XDOGE",
  "THOR",
  "BCT",
  "WE",
  "GGG",
  "GM",
  "GARI",
  "DEUS",
  "SNTR",
  "MTG",
  "SSV",
  "MBS",
  "MOO",
  "MAGICK",
  "STARS",
  "ZKL",
  "ARC",
  "COGI",
  "FLOKI",
  "WARS",
  "YOSHI",
  "NYAN",
  "KNOX",
  "NTX",
  "NINO",
  "BRUSH",
  "BEETS",
  "REAL",
  "FID",
  "FLIP",
  "CREDI",
  "CORGI",
  "MENGO",
  "DINGER",
  "CBX",
  "HWL",
  "CHAMP",
  "DOFI",
  "OCP",
  "SPY",
  "WLD",
  "NUM",
  "SLND",
  "SDT",
  "SMRTR",
  "AART",
  "GBD",
  "MANTA",
  "GENE",
  "GMCOIN",
  "CHLI",
  "GNS",
  "PICA",
  "STEMX",
  "SHIRYO",
  "LUFC",
  "SDOGE",
  "LICO",
  "ERW",
  "WMTX",
  "AFRO",
  "MNDE",
  "CPOO",
  "SPE",
  "INFO",
  "SANTA",
  "ENS",
  "LAVA",
  "EEUR",
  "P2PS",
  "B2M",
  "OBT",
  "OMAX",
  "GINZA",
  "SNAKES",
  "GFI",
  "PHB",
  "METAV",
  "DYOR",
  "SAM",
  "SB",
  "MNT",
  "PORTO",
  "RON",
  "AQUA",
  "SA",
  "WAM",
  "RIDE",
  "PLI",
  "WKD",
  "BABY",
  "GFT",
  "ZM",
  "EUL",
  "SWING",
  "JUNO",
  "GMM",
  "TRVL",
  "CPH",
  "SHIBA",
  "DKEY",
  "BOTTO",
  "TUT",
  "GCAKE",
  "IHC",
  "KITTY",
  "DCAU",
  "ECC",
  "HTD",
  "LQR",
  "JaiHo",
  "THC",
  "SPHYNX",
  "CDT",
  "BTH",
  "MMPRO",
  "VVS",
  "WCRO",
  "PSP",
  "VPAD",
  "PANDA",
  "BOBA",
  "PEAQ",
  "QORT",
  "PWT",
  "RICE",
  "XSP",
  "CRONA",
  "WCS",
  "SPFC",
  "CMDX",
  "REAL",
  "CCA",
  "MAGIC",
  "AURORA",
  "PEOPLE",
  "IRT",
  "VR",
  "SPIN",
  "CENX",
  "ALPH",
  "TAG",
  "MEX",
  "FCON",
  "FLUF",
  "UBIT",
  "JSOL",
  "ROY",
  "ORO",
  "VINU",
  "ML",
  "XMT",
  "EURA",
  "KEYS",
  "MILK",
  "RETH",
  "SIS",
  "EFC",
  "AVL",
  "TFS",
  "NAP",
  "EGAME",
  "KATA",
  "GENOME",
  "GSTS",
  "KUJI",
  "RADAR",
  "PEX",
  "BB",
  "SENATE",
  "CANDYLAD",
  "SANTOS",
  "RISE",
  "VINU",
  "RLB",
  "SWIN",
  "DCT",
  "TEM",
  "MOOO",
  "OPENX",
  "EShib",
  "LYRA",
  "IMPACTXP",
  "SIDUS",
  "SIPHER",
  "UMAMI",
  "DFH",
  "PINU",
  "KNG",
  "EGX",
  "FLX",
  "RISE",
  "DXGM",
  "CHEESE",
  "UMY",
  "HEART",
  "USTC",
  "KRRX",
  "MEER",
  "PRL",
  "VOXEL",
  "METAMUSK",
  "DOMI",
  "WX",
  "MCRT",
  "BENT",
  "LUCA",
  "PRISM",
  "BLOCK",
  "LMCSWAP",
  "MPWR",
  "FCP",
  "GMR",
  "STT",
  "KNIGHT",
  "ROCK",
  "GCOIN",
  "LOA",
  "BOMB",
  "MEFA",
  "RBC",
  "MTK",
  "LSC",
  "LUNAM",
  "MEOW",
  "PSTAKE",
  "RVC",
  "SILO",
  "POR",
  "MTS",
  "GQ",
  "BTT",
  "KUB",
  "CRF",
  "CHMB",
  "SOL",
  "WHALE",
  "BTC2X-FLI",
  "FREE",
  "SFM",
  "XUSD",
  "DINGO",
  "PI",
  "LUS",
  "DBD",
  "OHM",
  "FBX",
  "EFT",
  "ORT",
  "MMETA",
  "CNG",
  "HBOT",
  "IZI",
  "CNF",
  "EGG",
  "APX",
  "BMEX",
  "GST",
  "TRYC",
  "GEAR",
  "BTCMT",
  "CREAL",
  "GOHM",
  "UX",
  "SUPE",
  "COREUM",
  "TONIC",
  "DOME",
  "SOS",
  "KASTA",
  "SHIBDOGE",
  "DOM",
  "VPND",
  "MMF",
  "NMBTC",
  "TRI",
  "ISA",
  "NOS",
  "NETT",
  "HBB",
  "MVS",
  "CTP",
  "AOG",
  "ABEY",
  "BLD",
  "GTAI",
  "X",
  "SEOR",
  "FOX",
  "HOSKY",
  "AMETA",
  "JEFE",
  "NST",
  "WEGLD",
  "RRT",
  "MEAN",
  "STARS",
  "SHDW",
  "TAUM",
  "ALI",
  "SQR",
  "CMFI",
  "METO",
  "MCT",
  "MSTR",
  "XELS",
  "TTM",
  "mCEUR",
  "mCUSD",
  "PIP",
  "CREO",
  "STEP",
  "VCG",
  "MULTI",
  "MPC",
  "FYN",
  "WMEMO",
  "LOOKS",
  "RAT",
  "IXT",
  "LOKA",
  "VYFI",
  "REV",
  "LUM",
  "GIV",
  "HUAHUA",
  "FLAG",
  "SNS",
  "BNBTIGER",
  "UBXS",
  "DGLN",
  "USDs",
  "DIGau",
  "LSR",
  "QTC",
  "SPELLFIRE",
  "CATS",
  "JMPT",
  "QWT",
  "PUFF",
  "FANC",
  "STRM",
  "DBC",
  "SINGLE",
  "MART",
  "LIB",
  "DLB",
  "ORBR",
  "UXD",
  "MNFT",
  "CPR",
  "DAOSOL",
  "MOONEY",
  "RPC",
  "NYM",
  "ONI",
  "AEG",
  "FURY",
  "WAMPL",
  "DIFX",
  "MV",
  "AERO",
  "WALLET",
  "TRACE",
  "CULT",
  "JONES",
  "T",
  "SOCA",
  "INTL",
  "PDT",
  "AXL",
  "TDROP",
  "REIGN",
  "LENDA",
  "DOGEKING",
  "ABCD",
  "MARTIA",
  "NEXM",
  "RSS3",
  "EBYT",
  "ZEUM",
  "OGY",
  "HON",
  "RBT",
  "KT",
  "BSK-BAA025",
  "CCD",
  "MAV",
  "PLATA",
  "GMT",
  "IRON",
  "NBT",
  "RUBY",
  "ALPINE",
  "SHL",
  "PBX",
  "METAN",
  "BULT",
  "BBS",
  "KUNCI",
  "AVDO",
  "TITI",
  "SSU",
  "SOMM",
  "MSC",
  "B3X",
  "MILO",
  "QORPO",
  "RITE",
  "FTRB",
  "TOTO",
  "RBD",
  "LETSGO",
  "ERA",
  "SAFUU",
  "OATH",
  "sAVAX",
  "WZRD",
  "WTRX",
  "PACE",
  "SERSH",
  "AZIT",
  "CNC",
  "GALEON",
  "XCN",
  "stMATIC",
  "FWC",
  "POLYCUB",
  "ALOT",
  "A8",
  "BFIC",
  "STNEAR",
  "MONEY",
  "LOOP",
  "GLINK",
  "LQ",
  "WLKN",
  "FULA",
  "KOMPETE",
  "DUST",
  "WEAR",
  "LSWAP",
  "FACEDAO",
  "USDC.e",
  "APE",
  "UNITS",
  "MBX",
  "THT",
  "CRBRUS",
  "MDAO",
  "QOM",
  "KRO",
  "CLASS",
  "STG",
  "MEME",
  "MAY",
  "ITHEUM",
  "TARO",
  "PHL",
  "XX",
  "IRENA",
  "RADIO",
  "CHO",
  "SHIBKILLER",
  "SPACEPI",
  "QWLA",
  "ACN",
  "MEV",
  "GNFT",
  "OMI",
  "WIOTX",
  "H2O",
  "RATS",
  "BOOT",
  "SEBA",
  "CRYN",
  "LMR",
  "STI",
  "ATR",
  "ECOIN",
  "GYMNET",
  "ASTO",
  "DOLA",
  "SIFU",
  "VITA",
  "BRWL",
  "HERA",
  "GULF",
  "lolcat",
  "PLY",
  "COW",
  "XRPAYNET",
  "SUPER",
  "CZUSD",
  "WADA",
  "CROGE",
  "PANDA",
  "FGD",
  "STRNGR",
  "FPIS",
  "FPI",
  "WOOP",
  "CKC",
  "TIFI",
  "PDX",
  "TOTEM",
  "BRN",
  "PINETWORKDEFI",
  "FIST",
  "JEX",
  "NXUSD",
  "PPI",
  "USDH",
  "ZENC",
  "DFG",
  "AMAZINGTEAM",
  "EMP",
  "CAW",
  "COT",
  "WOM",
  "RUN",
  "MAV",
  "VOLT",
  "KZEN",
  "BTE",
  "HAWK",
  "MNTL",
  "DMT",
  "HDN",
  "GHUB",
  "LUSD",
  "SOVRN",
  "SHI",
  "MSQ",
  "LINEAR",
  "BIRB",
  "FITFI",
  "TAVA",
  "XRUN",
  "BKS",
  "REI",
  "FAKT",
  "LFNTY",
  "APEX",
  "KUKU",
  "CAT",
  "RIA",
  "NEKO",
  "STIMA",
  "WINTER",
  "FAME",
  "USDD",
  "EVMOS",
  "UNDEAD",
  "BIOFI",
  "SNACK",
  "MATICX",
  "EPX",
  "SPRING",
  "SUMMER",
  "SLIME",
  "HASH",
  "QUICK",
  "MVX",
  "$FORGE",
  "DCK",
  "RET",
  "KRD",
  "MMXN",
  "WNDR",
  "SFL",
  "EFFORT",
  "MINIMA",
  "PIGE",
  "HTO",
  "BULL",
  "LC",
  "MBD",
  "HOOP",
  "GST",
  "CGO",
  "XPM",
  "X",
  "DHN",
  "GRD",
  "LAND",
  "ORT",
  "KCT",
  "LUNA",
  "LM",
  "xUSD",
  "MXNt",
  "AURA",
  "IGU",
  "POLYX",
  "GRAV",
  "KAS",
  "CPS",
  "QTO",
  "VELO",
  "WE",
  "USDZ",
  "CLEG",
  "ROG",
  "WAGMIGAMES",
  "TRAXX",
  "SHINJI",
  "STC",
  "KLC",
  "STR",
  "REV3L",
  "LINU",
  "M87",
  "MLNK",
  "TAI",
  "LIF3",
  "FORT",
  "ICHI",
  "EURC",
  "CSR",
  "OZONE",
  "JPYC",
  "USDC(WormHole)",
  "COL",
  "BlueSparrow",
  "M",
  "WKC",
  "WEVER",
  "FER",
  "OLE",
  "BTC.b",
  "LKSM",
  "WELL",
  "HNB",
  "LOOK",
  "USDF",
  "KFI",
  "TSUKA",
  "RAMA",
  "FOXY",
  "NLC",
  "OSK",
  "WSI",
  "ZED",
  "MILK",
  "WRT",
  "AZY",
  "EURe",
  "BOMB",
  "NFTL",
  "SUI",
  "ROCKETFI",
  "LBT",
  "GEOD",
  "INUINU",
  "WOMBAT",
  "BMAX",
  "NEOX",
  "GARY",
  "GXA",
  "KSN",
  "OSK-DAO",
  "CTG",
  "ZILLIONXO",
  "RDNT",
  "BUILD",
  "ARB",
  "SQGROW",
  "STAT",
  "EARNM",
  "ONDO",
  "TTC",
  "AMA",
  "MRS",
  "GHNY",
  "STC",
  "MMIT",
  "ZETA",
  "LAND",
  "HERMES",
  "CRT",
  "SAFE",
  "OKINAMI",
  "ETHW",
  "lisUSD",
  "4EVER",
  "$YAKU",
  "SWEAT",
  "WBT",
  "ADDY",
  "MMF",
  "3AIR",
  "UVT",
  "LTRBT",
  "DC",
  "WWDOGE",
  "LBLOCK",
  "MTD",
  "axlUSDC",
  "WALV",
  "SSLX",
  "DIONE",
  "EGO",
  "ULX",
  "LISTA",
  "BNBX",
  "cbETH",
  "USDTZ",
  "BTCPAY",
  "SAFE",
  "LOE",
  "DJED",
  "stATOM",
  "SKEB",
  "CARR",
  "GRND",
  "RED",
  "CHRP",
  "KNDX",
  "USDT.e",
  "HOICHI",
  "METAL",
  "YYAVAX",
  "STRD",
  "TOS",
  "APT",
  "BKN",
  "TBC",
  "O",
  "ETHF",
  "ID",
  "DLC",
  "ZARP",
  "MPLX",
  "CUSD",
  "BOB",
  "RUG",
  "NSK",
  "STATE",
  "SAUCE",
  "ISK",
  "PIX",
  "LEOX",
  "KWENTA",
  "EGGT",
  "OKI",
  "BFT",
  "MIBR",
  "TET",
  "QIE",
  "HATCHY",
  "WAIT",
  "SONNE",
  "VBG",
  "IRISTOKEN",
  "ROND",
  "ATC",
  "STZU",
  "MEE",
  "SN",
  "VENOM",
  "ET",
  "LOAN",
  "ALEX",
  "RXT",
  "TORI",
  "ING",
  "ADO",
  "TTC",
  "LNR",
  "ZIX",
  "KRS",
  "KAP",
  "XEN",
  "MYTH",
  "ICSA",
  "00",
  "ELF",
  "PIB",
  "FRP",
  "MARCO",
  "MEWC",
  "OHO",
  "OAS",
  "THE",
  "MYRIA",
  "stAPT",
  "ACE",
  "HPO",
  "HELLO",
  "ASH",
  "FAR",
  "QUAI",
  "VRTX",
  "XPLA",
  "BGVT",
  "KCAL",
  "MMSC",
  "MGP",
  "LEVE",
  "PRIMAL",
  "PROTEO",
  "PALM",
  "ITA",
  "CPFC",
  "PEPE",
  "DOLZ",
  "HFT",
  "QUO",
  "CATHEON",
  "VNXAU",
  "DBI",
  "GGT",
  "JITOSOL",
  "GENZ",
  "TMG",
  "PZP",
  "KXP",
  "AUTUMN",
  "EQ9",
  "FTN",
  "ACX",
  "STB",
  "C4E",
  "MLC",
  "GAU",
  "DINO",
  "STRK",
  "PINE",
  "UUSD",
  "HOLY",
  "VASCO",
  "MIA",
  "IST",
  "NSTR",
  "JEUR",
  "CRVFRAX",
  "HOOK",
  "AL",
  "ASM",
  "TRI",
  "GFLY",
  "INDY",
  "VATRENI",
  "CANDY",
  "NUSA",
  "WNRG",
  "DIMO",
  "HONEY",
  "DNX",
  "TIA",
  "RXD",
  "NAVI",
  "REGENT",
  "DRB",
  "SDL",
  "SPXC",
  "VERSE",
  "eUSD",
  "LL",
  "ankrBNB",
  "GRAIL",
  "CAT",
  "ABEL",
  "GERMANY",
  "TIGRES",
  "TAO",
  "SFIT",
  "CROID",
  "CADINU",
  "IMPT",
  "IUSD",
  "AMKT",
  "DBR",
  "OVL",
  "NEON",
  "VXT",
  "LCRO",
  "HIFI",
  "NAVI",
  "MCOIN",
  "IBTC",
  "CHEEL",
  "OREO",
  "SPOT",
  "SHIK",
  "MURA",
  "LKT",
  "UNS",
  "T99",
  "LYFE",
  "BONK",
  "KABOSU",
  "SHEN",
  "LVL",
  "BLUR",
  "MATCH",
  "HAN",
  "SEI",
  "BTTY",
  "DUST",
  "LAKE",
  "CHILI",
  "SFRXETH",
  "FRONK",
  "SBONK",
  "HBARX",
  "RCM",
  "EDX",
  "ACS",
  "GRV",
  "GENI",
  "PLSB",
  "D2T",
  "COPE",
  "stJUNO",
  "ROE",
  "USP",
  "NEFTY",
  "FRXETH",
  "XI",
  "DOGGO",
  "DTG",
  "OFE",
  "TOMI",
  "CORE",
  "AREA",
  "SKETCH",
  "FLU",
  "VNO",
  "SHARKS",
  "AIPAD",
  "SEDA",
  "BTAF",
  "HILO",
  "GMMT",
  "AUD",
  "THE",
  "UT",
  "TALNT",
  "CRETA",
  "0x0",
  "XRPH",
  "ASTRO",
  "NEXA",
  "LOCK",
  "GFAL",
  "PAW",
  "WCFX",
  "RSO",
  "PSI",
  "ZYB",
  "SHIB0.5",
  "GXE",
  "CHIRP",
  "PEPE",
  "gCOTI",
  "PEN",
  "AVN",
  "ARC",
  "CVXFXS",
  "FCTR",
  "GHO",
  "CARMIN",
  "FERMA",
  "SHARBI",
  "WTAO",
  "CSIX",
  "KITTI",
  "MIR",
  "SLIZ",
  "SAKAI",
  "TROVE",
  "NUT",
  "WCORE",
  "VEE",
  "SKULL",
  "ALIEN",
  "HVH",
  "FORM",
  "SHDW",
  "FLOKICEO",
  "KAKI",
  "XCFX",
  "MSHD",
  "WINR",
  "AMPLE",
  "SCT",
  "CLOUD",
  "ICE",
  "HXD",
  "PRIME",
  "LFG",
  "HALO",
  "ARTY",
  "CGPT",
  "RJV",
  "UNIETH",
  "DEOD",
  "LSETH",
  "OPTI",
  "ROA",
  "EUROE",
  "KIBSHI",
  "HMND",
  "WEB4",
  "NXRA",
  "VARA",
  "LAI",
  "NEKO",
  "RAM",
  "BZE",
  "MAS",
  "MDUS",
  "CYBER",
  "USDGLO",
  "0x0",
  "CAT",
  "ROKO",
  "DOGECUBE",
  "STIK",
  "AI",
  "DAOP",
  "UW3S",
  "VAPE",
  "OVO",
  "LUFFY",
  "AGI",
  "CHT",
  "PMG",
  "SECT",
  "UNW",
  "PEPA",
  "ONE",
  "FUEL",
  "ZK",
  "MGKL",
  "IC",
  "RMV",
  "GOLDEN",
  "WUSDR",
  "RENQ",
  "MLXC",
  "VCHF",
  "WIFI",
  "CHAT",
  "HAIR",
  "RENEC",
  "CHR",
  "W$C",
  "WKAVA",
  "LFG",
  "BOW",
  "KSWAP",
  "LODE",
  "FUL",
  "SPACE",
  "SDEX",
  "GBK",
  "PROPC",
  "METFI",
  "VEUR",
  "ZNX",
  "LUMI",
  "OCTA",
  "CRAZYBUNNY",
  "THL",
  "OGGY",
  "OETH",
  "GPT",
  "LIMO",
  "SWITCH",
  "MCADE",
  "FLOKICASH",
  "BREAD",
  "DXN",
  "SDG",
  "ERN",
  "OTK",
  "KAU",
  "WHBAR",
  "RYOSHI",
  "ROCK",
  "KAG",
  "UCON",
  "LMWR",
  "AIDOGE",
  "PEPE",
  "CARAT",
  "SABAI",
  "enqAI",
  "ABC",
  "WOJAK",
  "WBESC",
  "XRPC",
  "BIDZ",
  "APED",
  "PER",
  "PEPE",
  "BOBO",
  "BZR",
  "shibai",
  "MUMU",
  "SGT",
  "BOB",
  "MOBILE",
  "EDU",
  "ETI",
  "ATHX",
  "FLIX",
  "BERA",
  "BULL",
  "IOT",
  "HYPC",
  "LBR",
  "GYOSHI",
  "JESUS",
  "WSB",
  "WBETH",
  "TRN",
  "WEFI",
  "CYBER",
  "RUM",
  "HSUITE",
  "$MONG",
  "ADF",
  "HAHA",
  "GTAN",
  "FXI",
  "QCK",
  "PEPECOIN",
  "TKC",
  "CCASH",
  "POOH",
  "LAMBO",
  "AJNA",
  "STRX",
  "SSE",
  "BIM",
  "4CHAN",
  "KVAI",
  "TURBO",
  "AUC",
  "SWELL",
  "CRVUSD",
  "GUAC",
  "CROWN",
  "PEPEAI",
  "ELMO",
  "WASSIE",
  "CLIPS",
  "KEKE",
  "KING",
  "PERRY",
  "RIBBIT",
  "FRTC",
  "PUGAI",
  "JEFF",
  "LADYS",
  "ORDI",
  "OBI",
  "GGP",
  "FOUR",
  "CRAZYPEPE",
  "SIMPSON",
  "BIBI",
  "SUIP",
  "SCS",
  "CETUS",
  "ARX",
  "PEPECHAIN",
  "SWTS",
  "SWETH",
  "NOOT",
  "$TOAD",
  "TURBOS",
  "MANIA",
  "JSM",
  "ELS",
  "TRAC",
  "DONS",
  "BITCOIN",
  "KARATE",
  "BOLT",
  "ABEL",
  "GP",
  "QCAD",
  "JKL",
  "SNEK",
  "BOBO",
  "WDOGE",
  "ANIMA",
  "GRAI",
  "PEPE",
  "SUIA",
  "WAGMI",
  "PEAR",
  "TWELVE",
  "PLSX",
  "HGPT",
  "EMP",
  "YU",
  "BAD",
  "SATOX",
  "SEED",
  "RFD",
  "AMBER",
  "EMR",
  "BNBLION",
  "DMT",
  "KINGY",
  "XAI",
  "CLNX",
  "JOEY",
  "CROWN",
  "MNTC",
  "PAYU",
  "JW",
  "AIT",
  "DUCKIES",
  "PEPE",
  "GMFAM",
  "COLLECT",
  "BXN",
  "UGOLD",
  "HBT",
  "WAR",
  "HUNDRED",
  "TIGERMOON",
  "CAH",
  "AEVUM",
  "FDUSD",
  "UNSHETH",
  "tBTC",
  "AMC",
  "ETPOS",
  "TOSHE",
  "BDXN",
  "XFI",
  "FNCT",
  "ISLM",
  "NOMOX",
  "CRYSTAL STONES",
  "SELF",
  "AXT",
  "GNC",
  "LOVE",
  "JIM",
  "CONE",
  "BANK",
  "NBLU",
  "LIZD",
  "SBC",
  "CLORE",
  "PIKA",
  "BBTF",
  "OX",
  "EQB",
  "PLANET",
  "FAKEAI",
  "XBTC",
  "MAJO",
  "AIPEPE",
  "DAO",
  "LAVITA",
  "INU",
  "NTRN",
  "QUBY",
  "HOW",
  "BLU",
  "PVC",
  "IDRX",
  "FUSDC",
  "CAT",
  "HACHI",
  "WECAN",
  "CCV2",
  "OCICAT",
  "PEPEW",
  "ELX",
  "3ULL",
  "CORGIAI",
  "IRC",
  "STT",
  "PLB",
  "HOME",
  "X",
  "SMILEY",
  "ZRO",
  "SCR",
  "KNS",
  "0XGAS",
  "UNIBOT",
  "FOOM",
  "APEPE",
  "RSC",
  "UNLEASH",
  "MNT",
  "WTFUEL",
  "WTHETA",
  "NARS",
  "FACT",
  "PIN",
  "PNP",
  "PAAL",
  "LUCKYSLP",
  "GMAC",
  "XNA",
  "NIX",
  "OUT",
  "PEPE2.0",
  "LAC",
  "STON",
  "LYUM",
  "RAIN",
  "AI",
  "MOOVE",
  "WKAS",
  "GENIE",
  "ARCH",
  "DLLR",
  "U2U",
  "FXD",
  "LDZ",
  "NESS",
  "ZOOMER",
  "CAMLY",
  "SHRED",
  "GSWIFT",
  "DOGE2.0",
  "STUFF",
  "CHARGED",
  "LEE",
  "SOPH",
  "LTX",
  "Shiba 2.0",
  "SHIB2.0",
  "OSAK",
  "ARKM",
  "ETHX",
  "slisBNB",
  "EQPAY",
  "XTER",
  "ASEED",
  "BTC2.0",
  "EXTRA",
  "WMNT",
  "LYX",
  "XRP 2.0",
  "AFX",
  "ION",
  "LINEA",
  "MOG",
  "WSTUSDT",
  "XD",
  "ETHEREUM",
  "WMOXY",
  "HTM",
  "XDOGE",
  "X",
  "PNDC",
  "BALD",
  "EXA",
  "TOSHI",
  "SOLANA",
  "SYNTH",
  "RCKT",
  "USDbC",
  "BSWAP",
  "ZBU",
  "KYVE",
  "X",
  "PYUSD",
  "COIN",
  "BASE",
  "NT",
  "STUSDT",
  "SWCH",
  "XRP",
  "TREAT",
  "EDE",
  "PENGY",
  "SCM",
  "TRUMP",
  "BNBDOG",
  "JETTON",
  "BABYSHIB",
  "SHIA",
  "PEPE",
  "BANUS",
  "W3S",
  "UCJL",
  "NPC",
  "MAGA",
  "DORA",
  "WRON",
  "OGD",
  "WPOKT",
  "PASG",
  "BNBCAT",
  "FOG",
  "FINE",
  "SMURFCAT",
  "STBT",
  "BANANA",
  "VARA",
  "CJPY",
  "OZO",
  "BSX",
  "SPX",
  "XRP20",
  "MKUSD",
  "FLRBRG",
  "ZF",
  "OMT",
  "BOBA",
  "CONX",
  "OMIKAMI",
  "GEMSTON",
  "JTT",
  "SHIBU",
  "BNBDOGE",
  "CAL",
  "GOLD",
  "PYTH",
  "WSM",
  "WFLR",
  "WAGMI",
  "DSHIB",
  "SATS",
  "LONG",
  "KIZUNA",
  "SOIL",
  "CRAZYMUSK",
  "OVN",
  "BIGTIME",
  "NBABSC",
  "MARIO",
  "ZTX",
  "UFC",
  "SPIDERMAN",
  "HAY",
  "PREME",
  "PAW",
  "SPURS",
  "GEKKO",
  "JUSDT",
  "JUSDC",
  "ULTIMA",
  "HALLOWEEN",
  "BYTES",
  "BEAM",
  "TOKEN",
  "MEME",
  "SPACEPI",
  "BNBTIGER",
  "POL",
  "DYDX",
  "BLF",
  "SMART",
  "SIMPSONS",
  "XVG",
  "SDAI",
  "SHRAP",
  "ETF",
  "CA",
  "ELMT",
  "OSHI",
  "GPRO",
  "MYRO",
  "DOGE",
  "PROPS",
  "CHAPZ",
  "GROK",
  "CAGA",
  "FANX",
  "vAAVE",
  "vCAKE",
  "vTRX",
  "vTUSD",
  "MUBI",
  "NUT",
  "TPAD",
  "vUNI",
  "STARSHIP",
  "DOGE",
  "USDV",
  "SPECTRE",
  "DOGE-1",
  "AIA",
  "FLOKIX",
  "rats",
  "BEFE",
  "OLAS",
  "PTH",
  "$FM",
  "$PEEP",
  "osETH",
  "MOCHI",
  "ROOT",
  "BLAST",
  "NLS",
  "ZEPH",
  "SHIBA",
  "JOE",
  "NIBI",
  "HOLD",
  "LIQ",
  "USDCASH",
  "DEXNET",
  "JTO",
  "XAH",
  "WBS",
  "CRAZYCAT",
  "BCUT",
  "RMBCASH",
  "PALM",
  "EETH",
  "CZGOAT",
  "FOMO",
  "VC",
  "PT",
  "FROGE",
  "AEUR",
  "CRAZYDOGE",
  "DARIK",
  "WARPED",
  "BSSB",
  "INSP",
  "PIKACHU",
  "BAZED",
  "GEC",
  "DAWG",
  "SEAM",
  "UPC",
  "VCNT",
  "LVN",
  "ROCKY",
  "BYTE",
  "FWD",
  "MUSIC",
  "ACE",
  "COQ",
  "GTA6",
  "TESLAI",
  "AIAT",
  "AIG",
  "ZETRIX",
  "weETH",
  "MARSUPILAMI",
  "DFC",
  "CAT",
  "XETH",
  "SOLS",
  "GREEN",
  "GTAVI",
  "BIG",
  "GROKGIRL",
  "AGX",
  "UNP",
  "WOLF",
  "WIF",
  "VPR",
  "GROKINU",
  "NINJA",
  "AVIVE",
  "NFP",
  "POPCAT",
  "HEMULE",
  "SILLY",
  "1CAT",
  "stTON",
  "BABYCAT",
  "EGG",
  "BABYBONK",
  "GM",
  "ZERO",
  "PLQ",
  "ANALOS",
  "SSHIB",
  "SOBER",
  "SANTA",
  "AKI",
  "TURT",
  "OMNI",
  "MAVIA",
  "ADA",
  "KIMBO",
  "SMOL",
  "MTC",
  "CIF",
  "AI",
  "AI",
  "NOT",
  "GUI",
  "MOE",
  "JLP",
  "FREN",
  "ZKF",
  "BSOL",
  "GONE",
  "SOLZILLA",
  "DUEL",
  "GEC",
  "DOGE",
  "DOODOO",
  "AIT",
  "BORK",
  "CAPINFRA",
  "BRETT",
  "PIF",
  "KITTY",
  "GECKO",
  "DOGI",
  "CKBTC",
  "CKETH",
  "AI",
  "TGC",
  "ORDS",
  "HEX",
  "OMD",
  "DYM",
  "XAI",
  "JOTCHUA",
  "DRAGON",
  "DRAGON",
  "CC",
  "CKP",
  "SDOGE",
  "FINC",
  "USEDCAR",
  "RETIK",
  "EXE",
  "TELEBTC",
  "MICKEY",
  "WEXO",
  "BABYDRAGON",
  "MEMES",
  "BOZO",
  "WIN",
  "SONIC",
  "PHASMA",
  "CRAZYDRAGON",
  "SOLAMA",
  "TITANX",
  "MEMEAI",
  "MYRA",
  "PORT3",
  "AMAPT",
  "METH",
  "GMRX",
  "XPHX",
  "TWD",
  "EURR",
  "MTC",
  "DRAGON",
  "CHINU",
  "FUD",
  "CCC",
  "RIB",
  "ALT",
  "LIGO",
  "SAROS",
  "PEPE",
  "HARAMBE",
  "TONNEL",
  "FPS",
  "DMCC",
  "SAVM",
  "DOGE",
  "MINU",
  "DCD",
  "VONSPEED",
  "TYPE",
  "WYNN",
  "GMTO",
  "SATOSHI",
  "BNBLION",
  "PONKE",
  "HONK",
  "ABOND",
  "HTX",
  "daCat",
  "QUBIC",
  "BEFI",
  "WEN",
  "BTCINU",
  "CDX",
  "PEAS",
  "CNG",
  "WXDC",
  "MXM",
  "ETHI",
  "DEFI",
  "BABYPEPE",
  "LRDS",
  "cNGN",
  "BOOM",
  "JUP",
  "EGG",
  "MCN",
  "UZX",
  "PORK",
  "PROS",
  "ANUS",
  "LION",
  "GME",
  "RSETH",
  "BABYLONG",
  "TANGYUAN",
  "HARAMBEAI",
  "CIRCLE",
  "HOLD",
  "USDY",
  "USDC+",
  "AERO",
  "DRAGON",
  "EMC",
  "WHALES",
  "FAR",
  "EDUM",
  "PANDORA",
  "CASINU",
  "NAVX",
  "NEVER",
  "RODAI",
  "BOZO",
  "TYBG",
  "UNA",
  "DOGWIFHAT",
  "WUSD",
  "ARBUZ",
  "KEKEC",
  "CHONKY",
  "PUFETH",
  "BEBE",
  "OORT",
  "PIXEL",
  "DRAGON",
  "RAIN",
  "VSG",
  "SPONGE",
  "SMOG",
  "DRAGON",
  "TADA",
  "TRUMP",
  "GIGA",
  "LNDX",
  "UNMD",
  "RVM",
  "LENDS",
  "VSUI",
  "HASUI",
  "DOGE",
  "SHEB",
  "VIRTUAL",
  "stTIA",
  "stOSMO",
  "SHIB",
  "SORA",
  "QGOV",
  "ZKML",
  "NMT",
  "ESE",
  "DTEC",
  "DEVVE",
  "SNEED",
  "CAT",
  "USDe",
  "sUSDe",
  "MIM",
  "BABYTROLL",
  "CHAT",
  "VIA",
  "DUKO",
  "TROLL",
  "BAI",
  "GPU",
  "AIKEK",
  "LUSH",
  "CHAT",
  "EZETH",
  "SIMPSON",
  "LYNX",
  "NWS",
  "BNBSNAKE",
  "OX",
  "BNBVEGETA",
  "BABYTRUMP",
  "MASA",
  "EVR",
  "TAONU",
  "PORTAL",
  "AXGT",
  "STRUMP",
  "BICS",
  "DOGO",
  "BENDOG",
  "VES",
  "DECHAT",
  "NEURALINK",
  "MYTH",
  "NMD",
  "W",
  "ASTRA",
  "MINU",
  "USDB",
  "G3",
  "MZK",
  "UBU",
  "RABI",
  "USDCAT",
  "BLACKDRAGON",
  "TATSU",
  "GROW",
  "PUPPIES",
  "EVO",
  "ZYN",
  "CRAZYBONK",
  "KERMIT",
  "BABYPEPE",
  "GVC",
  "TYT",
  "BLENDR",
  "SHIBAAI",
  "AAST",
  "BFICGOLD",
  "RYU",
  "KNINE",
  "BABY",
  "UPDOG",
  "AEVO",
  "BSTC",
  "SCA",
  "TECH",
  "NOCHILL",
  "BONK2.0",
  "BODEN",
  "stAVAX",
  "ALVA",
  "GRM",
  "RAFF",
  "ZRC",
  "MK",
  "TREMP",
  "DOGS",
  "KONET",
  "SMF",
  "STAR",
  "WHOREN",
  "DEAI",
  "SOLNIC",
  "BRETT",
  "HOTKEY",
  "MILLI",
  "SMH",
  "EARN",
  "SNOOPY",
  "CHMPZ",
  "ZKJ",
  "CSWAP",
  "PEPE",
  "PENG",
  "FREN",
  "SI",
  "APEWIFHAT",
  "POU",
  "ANDY",
  "ZYPTO",
  "ETHFI",
  "FLOKITA",
  "SORADOGE",
  "FRGX",
  "IO",
  "MGC",
  "MELANIA",
  "BABYSOL",
  "FAM",
  "ELGATO",
  "PAJAMAS",
  "FLOKI",
  "GROW",
  "BOME",
  "ANDY",
  "DSYNC",
  "SBF",
  "NFE",
  "$NAP",
  "BYAT",
  "BRIUN",
  "SOLANA",
  "SOLC",
  "SLERF",
  "MONKEY",
  "IVPAY",
  "BSHIB",
  "UDS",
  "PUFF",
  "VCAT",
  "ANDY",
  "SHFL",
  "KLS",
  "MFERS",
  "BCOQ",
  "RSWETH",
  "BONK",
  "MAZZE",
  "LMEOW",
  "CHKN",
  "BANX",
  "BNBBONK",
  "HUND",
  "APU",
  "SKID",
  "HOKK",
  "ELECTRON",
  "BENJI",
  "EDGESOL",
  "PLX",
  "GRIMACE",
  "SMOLE",
  "DUCK",
  "GIGA",
  "BABYBOME",
  "SQUAD",
  "IQ50",
  "ATH",
  "BAG",
  "KOKO",
  "SCOTTY",
  "ENTS",
  "DEGEN",
  "FLT",
  "BIRDDOG",
  "GNUS",
  "WSDM",
  "SHIB",
  "PUNDU",
  "PUNK",
  "TINU",
  "STONKS",
  "REDO",
  "FISH",
  "WIF",
  "AKITA",
  "PLANE",
  "MEW",
  "SHIV",
  "BASE",
  "COINYE",
  "NES",
  "GAGA",
  "SHROOM",
  "SNSY",
  "BOBAOPPA",
  "ATM",
  "STRAX",
  "ENA",
  "LNQ",
  "BLAZE",
  "MOON",
  "BENJI",
  "BNBFLOKI",
  "ROCK",
  "UBE",
  "$mfer",
  "ORBIO",
  "CATWIF",
  "FLOKI",
  "DAW",
  "MAGATRUMP",
  "BTCF",
  "YAI",
  "O4DX",
  "MUMU",
  "MBC",
  "TPRO",
  "SISC",
  "CRMS",
  "GB",
  "LONG",
  "ALAN",
  "SC",
  "OMNI",
  "BENI",
  "BOE",
  "POOP",
  "CAT",
  "TRUNK",
  "HOBA",
  "HOBBES",
  "DPLN",
  "HASHAI",
  "SAGA",
  "SVPN",
  "ZEUS",
  "EGG",
  "CAW",
  "AABL",
  "ROOST",
  "DODO",
  "CAT",
  "KOIN",
  "VSX",
  "HAROLD",
  "MOGGO",
  "BUL",
  "SPDR",
  "ORBT",
  "TNSR",
  "ANDY",
  "COOL",
  "BURN",
  "CATME",
  "MEMAGX",
  "APX",
  "CAT",
  "XTO",
  "NUB",
  "EIGEN",
  "MON",
  "PRZS",
  "GBTC",
  "$DAUMEN",
  "KOI",
  "COST",
  "BOOP",
  "NEURAL",
  "PONCHO",
  "DINO",
  "ALB",
  "BCCOIN",
  "DOGE",
  "BOSHI",
  "HAMI",
  "NEGED",
  "PBUX",
  "EPIK",
  "CROB",
  "WMN",
  "FOFAR",
  "BASEDAI",
  "FOXY",
  "CCC",
  "MOUTAI",
  "FOX",
  "SECOND",
  "ALE",
  "KING",
  "XZK",
  "ICC",
  "OIL",
  "CHUCK",
  "AGT",
  "GBE",
  "ZBCN",
  "KEYCAT",
  "CAT",
  "CEICAT",
  "POWSCHE",
  "PEEZY",
  "QFI",
  "SPEND",
  "TOBY",
  "PRCL",
  "PAC",
  "SHARK",
  "BANK",
  "BONK",
  "DOVU",
  "DITH",
  "WUF",
  "NITEFEEDER",
  "ROSE",
  "$BLUE",
  "AOC",
  "CAT",
  "SHORK",
  "DD",
  "BODA",
  "RWA",
  "MERL",
  "DEEPAI",
  "BSB",
  "WW3",
  "ATS",
  "SNA",
  "ESX",
  "FUNGI",
  "MCTP",
  "BB",
  "CGO",
  "LBM",
  "SOLCEX",
  "OGPU",
  "SOLALA",
  "GIOVE",
  "DOGINME",
  "NAI",
  "TONALD",
  "TICO",
  "HLN",
  "WOLF",
  "$OPCAT",
  "BIRDDOG",
  "WEB3",
  "COLLE",
  "GUMMY",
  "ERIC",
  "DLORD",
  "USD.C",
  "WOLF",
  "KARRAT",
  "$MICRO",
  "CATA",
  "RTF",
  "REZ",
  "MEM",
  "ANON",
  "DOGE",
  "HOPPY",
  "WHY",
  "WIFE",
  "BORED",
  "BENTO",
  "CHEERS",
  "SGR",
  "ABI",
  "CONAN",
  "PEPE",
  "WOLF",
  "SMX",
  "WOKB",
  "SNORT",
  "MANEKI",
  "BOYSCLUB",
  "XSWAP",
  "CDCETH",
  "FLDT",
  "DOG",
  "NORMIE",
  "DOGE20",
  "$MICHI",
  "WIT",
  "BOBE",
  "KHAI",
  "MON",
  "RFRM",
  "TOOKER",
  "ZENT",
  "CRYO",
  "LONG",
  "RUNECOIN",
  "eloncoin",
  "GVL",
  "KMNO",
  "COOL",
  "CATGPT",
  "WAI",
  "BIAO",
  "MERY",
  "BIRDDOG",
  "THREE",
  "MODE",
  "POPDOG",
  "GMFI",
  "AMERICA",
  "BARRON",
  "CARLO",
  "RC",
  "HEGE",
  "PONGO",
  "$MEWING",
  "KEPT",
  "ROCKY",
  "WTEC",
  "LOBO",
  "FECES",
  "TICS",
  "FRIEND",
  "BUNNY",
  "DUREV",
  "ZERO",
  "Y8U",
  "BOOMER",
  "MOCHI",
  "POGS",
  "NIAO",
  "DOGE",
  "PNIC",
  "TOMAN",
  "DOKY",
  "STAKE",
  "SVL",
  "AXM",
  "$JOGECO",
  "SQUOGE",
  "SOURCE",
  "KENDU",
  "MONKE",
  "CROAK",
  "XB",
  "PLN",
  "BDAG",
  "SLOTH",
  "MCG",
  "CRODIE",
  "VOPO",
  "PEDRO",
  "BOOE",
  "SKI",
  "BNBBUNNY",
  "GIKO",
  "CTA",
  "HABIBI",
  "MONK",
  "DIP",
  "STORM",
  "ICPX",
  "LEGION",
  "JUSD",
  "LOS",
  "$MBAG",
  "BUCK",
  "MINI",
  "BET",
  "HRT",
  "GAME",
  "GME",
  "MOST",
  "DOOMER",
  "SPEED",
  "MPRO",
  "FOXSY",
  "GOME",
  "RPLAY",
  "UTYAB",
  "DRIFT",
  "HODL",
  "NOHAT",
  "HAMMY",
  "TRIO",
  "WBS",
  "CATX",
  "GOLDAO",
  "BUBBLE",
  "USA",
  "PPFT",
  "CHEEPEPE",
  "MAGA",
  "NCASH",
  "PROOF",
  "KANG",
  "MEOW",
  "SKYA",
  "BEER",
  "CVAI",
  "NATIX",
  "BRETT",
  "BARRON",
  "CES",
  "BNBOLYMPIC",
  "PINU100X",
  "ZACK",
  "ARG",
  "NIGHT",
  "RPEPE",
  "RADX",
  "ZCHF",
  "HSAI",
  "OKAYEG",
  "KILLA",
  "ACHI",
  "APPLE",
  "PEANIE",
  "HIGHER",
  "KEK",
  "EAI",
  "LOVE",
  "FDM",
  "BUBBA",
  "STASH",
  "BTCDRAGON",
  "EVR",
  "CAT",
  "MAGAPEPE",
  "WLTH",
  "$WAFFLES",
  "WEIRDO",
  "KIM",
  "DOP",
  "TBC",
  "SHARE",
  "LRT",
  "GROYPER",
  "MUSCAT",
  "$PELF",
  "CHAD",
  "MOEW",
  "PIXFI",
  "NXQ",
  "SHIB",
  "BWB",
  "ULTI",
  "CHOMP",
  "MOTHER",
  "VT",
  "PEW",
  "TAIKO",
  "MOCA",
  "DBR",
  "LFGO",
  "ELIX",
  "TUZKI",
  "WALTER",
  "PESHI",
  "NYXC",
  "TRUMP",
  "EAGLE",
  "SOLCAT",
  "DADDY",
  "TROG",
  "PEPEMAGA",
  "GAT",
  "314DAO",
  "SNPAD",
  "$TOAD",
  "MINE",
  "SELFIE",
  "RYU",
  "PEPE",
  "PE",
  "EAGLE",
  "UAHG",
  "SCHRODI",
  "BLS",
  "PEPO",
  "PEIPEI",
  "PRICK",
  "ARTFI",
  "BTCB",
  "MAGASHIB",
  "MOR",
  "LCG",
  "CAT",
  "MAGA",
  "GHOST",
  "BILLY",
  "DOGEVERSE",
  "MAGADOGE",
  "AIR",
  "SL",
  "DOPU",
  "9MM",
  "TRUMP",
  "MITTENS",
  "TOPG",
  "PIRATE",
  "RNT",
  "HTS",
  "SKAI",
  "DOGER",
  "BIAO",
  "ZUSHI",
  "UDAO",
  "CELL",
  "PGPT",
  "ICS",
  "BOLT",
  "CHRETT",
  "GEMS",
  "BABYPEPE",
  "BRETT",
  "LTT",
  "HONK",
  "WSEI",
  "AZUR",
  "BIF",
  "COK",
  "LFIT",
  "S315",
  "EAI",
  "ASS",
  "STONKS",
  "PEP",
  "DIDID",
  "WIF",
  "KERMIT",
  "SVN",
  "DADDY",
  "CHIPPY",
  "MOGE",
  "KIRO",
  "COOKIE",
  "AURA",
  "LAIKA",
  "WOLF",
  "RECA",
  "FROG",
  "AEROBUD",
  "KENDU",
  "GIGACHAD",
  "PTRUMP",
  "AMC",
  "CRYPTON",
  "SPIKE",
  "LKI",
  "ZIK",
  "LB",
  "CHIPPY",
  "DJT",
  "LAK3",
  "SBAE",
  "LILPUMP",
  "WAT",
  "aUSDT",
  "FLAPPY",
  "BILLY",
  "ETHB",
  "FLOCKA",
  "XOXNO",
  "BALT",
  "RETARDIO",
  "HAWKTUAH",
  "HGEN",
  "CHUANPU",
  "FAC",
  "WHISKEY",
  "$CHIDO",
  "WVTRS",
  "POCAT",
  "FTR",
  "ANDWU",
  "SCRAT",
  "NEURON",
  "$WATER",
  "RCH",
  "DORKY",
  "RWT",
  "EMT",
  "SHRUB",
  "DRAGGY",
  "MARV",
  "KINIC",
  "RNT",
  "PEEPO",
  "ANDY",
  "KAI",
  "ZEX",
  "TAL",
  "ZEUS",
  "BUCKY",
  "CRASH",
  "SKOP",
  "STAPT",
  "MMIP",
  "MLC",
  "ANYONE",
  "SPIKE",
  "MICHI",
  "CHWY",
  "BOYS",
  "BOGGY",
  "GROOVE",
  "$COFEEE",
  "FLORK",
  "BPT",
  "CPL",
  "DOOGLE",
  "GCB",
  "FEG",
  "PEOPLE",
  "SOPH",
  "ROAM",
  "XION",
  "JASON",
  "DCI",
  "REXHAT",
  "BIB",
  "MAD",
  "MAN",
  "BCHB",
  "USA",
  "G",
  "MAXETH",
  "BUD",
  "COIN",
  "RIS",
  "XPX",
  "CAD",
  "ROAR",
  "ICL",
  "OILX",
  "SHIBA",
  "XAGX",
  "GONDOLA",
  "XR",
  "TRALA",
  "OPN",
  "META",
  "TOWELI",
  "$PURPE",
  "MELLOW",
  "$LANDLORD",
  "MOLI",
  "MATT",
  "FOUR",
  "ALEO",
  "STO",
  "HMSTR",
  "HYPE",
  "ME",
  "BABY",
  "BUB",
  "ROCKY",
  "WXT",
  "$WELL",
  "MATT",
  "SYK",
  "AARK",
  "LEDGER",
  "CYBRO",
  "COOK",
  "RECORD",
  "RFL",
  "PMT",
  "PEIPEI",
  "BBTC",
  "FIGHT",
  "TRHUB",
  "CLOKI",
  "ANDY",
  "UXLINK",
  "HIT",
  "FEARNOT",
  "FIGHT",
  "PUMPBTC",
  "GRASS",
  "VANCE",
  "BEEF",
  "ORC",
  "torsy",
  "MIGGLES",
  "DGTA",
  "CLOUD",
  "FBTC",
  "USD0",
  "BRETTA",
  "SAITAMA",
  "MILKBAG",
  "MXNB",
  "PUFFER",
  "BABYPEIPEI",
  "SPARKLET",
  "SOY",
  "FEFE",
  "GUZUTA",
  "XUSD",
  "WYZ",
  "BTCLE",
  "AVAIL",
  "$TIME",
  "DONALD",
  "JVT",
  "HEHE",
  "NCOIN",
  "AIM",
  "USPEPE",
  "NPCS",
  "SKBDI",
  "EKUBO",
  "HACD",
  "PLAY",
  "KAMA",
  "SIMPSON",
  "TIMI",
  "BROKE",
  "BULLISH",
  "BRAINLET",
  "BABYNEIRO",
  "MOVE",
  "USDL",
  "NEIRO",
  "NEIRO",
  "DRIP",
  "L3",
  "DOLLAR",
  "MOXIE",
  "NUTS",
  "GM",
  "CAT",
  "BAKED",
  "AST",
  "UXD",
  "PAN",
  "SIGMA",
  "IRO",
  "NOTAI",
  "XROCK",
  "FWOG",
  "MIND",
  "DMAGA",
  "CHEESE",
  "NRN",
  "NEIRO",
  "GINNAN",
  "CXT",
  "PEPE",
  "PACK",
  "DODO",
  "RYO",
  "LOAFCAT",
  "ONI",
  "KEN",
  "RIZO",
  "ROUTE",
  "HYDRA",
  "REGI",
  "TRUMP",
  "JOULE",
  "INVITE",
  "META",
  "SKX",
  "JHH",
  "WAI",
  "NCN",
  "BALL",
  "UMM",
  "PINS",
  "ECHO",
  "sSOL",
  "NOMNOM",
  "SCF",
  "WDOG",
  "99BTC",
  "RTR",
  "CATDOG",
  "EURI",
  "USA",
  "XEL",
  "MOVEUSD",
  "BTW",
  "BTX",
  "S",
  "GOU",
  "AGETH",
  "WRSETH",
  "DOGS",
  "WrBTC",
  "KEN",
  "UWU",
  "BEBE",
  "DOGS",
  "SUNDOG",
  "LAVA",
  "CAT",
  "ELF",
  "TXC",
  "ALPHA",
  "XNET",
  "ATLA",
  "GOCHU",
  "wzkCRO",
  "USDZ",
  "DOGE",
  "MIRAI",
  "USSD",
  "ORE",
  "EBULL",
  "BINANCEDOG",
  "EURCV",
  "IVfun",
  "FUELX",
  "ORDER",
  "FRED",
  "AXGT",
  "FLUFFI",
  "BULL",
  "TRUMP",
  "SAI",
  "SUNCAT",
  "BOE",
  "BBC",
  "LVLY",
  "SWGT",
  "AUSD",
  "MCDULL",
  "CTO",
  "R/SNOOFI",
  "CSW",
  "USR",
  "FIG",
  "LMF",
  "KAIA",
  "BNSOL",
  "LIQ",
  "AUKI",
  "DSC",
  "BELLS",
  "UFO",
  "BERRY",
  "SHARP",
  "SPEC",
  "MAK",
  "TRUMP",
  "ZFI",
  "UNICORN",
  "PHIL",
  "FB",
  "NS",
  "VISTA",
  "TROLLICTO",
  "GRASS",
  "TBULL",
  "CATI",
  "AIC",
  "TBX",
  "MEN",
  "USDG",
  "METAKPK",
  "PEPE",
  "UNIO",
  "NEIRO",
  "CBPAY",
  "FTW",
  "CBBTC",
  "BOBER",
  "MKL",
  "SVTS",
  "FAH",
  "NYA",
  "LUCI",
  "MICRODOGE",
  "DEEBO",
  "WLFI",
  "DIN",
  "NKYC",
  "$CATALORIAN",
  "GGB",
  "SKY",
  "USDS",
  "AGENT",
  "CCO2",
  "PEPE",
  "JIN",
  "slisBNBx",
  "SDOGE",
  "UNCN",
  "MOODENG",
  "XBG",
  "FU",
  "GINNAN",
  "MOODENG",
  "LOGX",
  "EGP",
  "BB",
  "BABYCATE",
  "X",
  "SOS",
  "BOX",
  "WAT",
  "INIT",
  "THUG",
  "WIGL",
  "TCAT",
  "OWN",
  "AGURI",
  "CHEEMS",
  "ABDS",
  "WCT",
  "Blum",
  "SOURCE",
  "XYRO",
  "MARS",
  "PUSS",
  "PUGWIF",
  "MBP",
  "FLAY",
  "DOE",
  "AXOL",
  "NEIRO",
  "MAJOR",
  "MTLS",
  "DYNA",
  "TOKE",
  "PESTO",
  "LYK",
  "MISHA",
  "MARVIN",
  "HUAHUA",
  "BABYBNB",
  "ZHOA",
  "LAB",
  "VERT",
  "MELO",
  "POX",
  "TERMINUS",
  "WLFI",
  "MARVIN",
  "HIPPO",
  "SPS",
  "CHEEMS",
  "SUIB",
  "VOLT",
  "MANYU",
  "DOGEN",
  "BLUB",
  "FWOG",
  "LOULOU",
  "MOO",
  "DOGGO",
  "WXM",
  "POCHITA",
  "BOB",
  "BURN",
  "SolvBTC",
  "PUPS",
  "SUIMAN",
  "CATS",
  "ESTEE",
  "BKOK",
  "CB",
  "CSI",
  "MARS",
  "AIRDROP",
  "LABUBU",
  "LEPER",
  "EVA",
  "ICBX",
  "TERMINUS",
  "MSTR",
  "SOFAC",
  "MCAKE",
  "BRIAN",
  "CARV",
  "HAWK",
  "WAP",
  "DEEP",
  "WPAY",
  "KLAUS",
  "KOMA",
  "COCO",
  "NSDQ",
  "PAI",
  "ITO",
  "TUA",
  "STIX",
  "UNI",
  "LUMIA",
  "GOAT",
  "DOLAN",
  "SQUID",
  "ROT",
  "USDS",
  "PAC",
  "MINGO",
  "HOLD",
  "MEMEFI",
  "SEED",
  "WCHZ",
  "UTHX",
  "HACHI",
  "MEDUSA",
  "RXS",
  "KIMA",
  "SPEEDY",
  "FORU",
  "TALENT",
  "VULT",
  "SHARKI",
  "DMAGA",
  "HEDGE",
  "CJ",
  "B3TR",
  "autism",
  "kBTC",
  "HDRO",
  "ACCES",
  "PDOGE",
  "BABYNEIRO",
  "DRAGONX",
  "FWOG",
  "RALLY",
  "LUNA",
  "COR",
  "BTMT",
  "KASPY",
  "INSURANCE",
  "KITEAI",
  "JANET",
  "BEAST",
  "ACT",
  "NACHO",
  "GNON",
  "SWORLD",
  "BOPPY",
  "ZND",
  "BABYHIPPO",
  "WAAC",
  "DOGAI",
  "SHOGGOTH",
  "SLOP",
  "FARTCOIN",
  "FLAVIA",
  "SHAR",
  "PEPPER",
  "BDX",
  "OSCAR",
  "RWAINC",
  "MIHARU",
  "MemesAI",
  "FNXAI",
  "SDOGE",
  "BRO",
  "GAMA",
  "TATE",
  "LBTC",
  "PINO",
  "RATS",
  "BOG",
  "$DICE",
  "SPX2.0",
  "SWITCH",
  "GOATS",
  "SHIKOKU",
  "PDJT",
  "TITS",
  "PEEZY",
  "BX",
  "LUCE",
  "KING",
  "EBTC",
  "TRUF",
  "47",
  "BRIL",
  "ARENA",
  "SCARCITY",
  "SUMMIT",
  "MDB",
  "COOK",
  "CHIB",
  "TURBO",
  "VON",
  "MRSOON",
  "DOGE",
  "USD+",
  "WOD",
  "CATANA",
  "THECAT",
  "YLAY",
  "LEMX",
  "RWA",
  "UNIT0",
  "PATRIOT",
  "PNUT",
  "USDG",
  "EARL",
  "NIKO",
  "RECT",
  "RUSSELL",
  "DAGS",
  "XGP",
  "SYRUP",
  "ME",
  "BBSOL",
  "ynETHx",
  "BABYPOPCAT",
  "EYWA",
  "ROSS",
  "HSK",
  "SBR",
  "DUCKY",
  "BERT",
  "TOAD",
  "888",
  "GOLD",
  "BULL",
  "TDS",
  "BTCAT",
  "BAN",
  "RAPTOR",
  "MELON",
  "HAPPY",
  "SHEGEN",
  "WMM",
  "KONG",
  "AIPO",
  "BGSOL",
  "SP",
  "$DROPEE",
  "PEANUT",
  "FTD",
  "SAD",
  "EUR\u0421",
  "TEA",
  "DANNY",
  "BABYBTC",
  "TAP",
  "KDX",
  "PNUT",
  "$INA",
  "LAPUPU",
  "CDOGE",
  "PAI",
  "ALL",
  "SERV",
  "STOP",
  "GATSBY",
  "AAX",
  "CMETH",
  "USUAL",
  "BABYPNUT",
  "bUSD0",
  "SUT",
  "OBOT",
  "CHEYENNE",
  "MLP",
  "DEGOD",
  "PUMP",
  "DARAM",
  "CTB",
  "FRED",
  "BARSIK",
  "UNFK",
  "PIN",
  "NUTZ",
  "LUM",
  "SCRVUSD",
  "VVAIFU",
  "AI16Z",
  "BNTY",
  "OL",
  "ANR",
  "AURORA",
  "RATS",
  "MAJOR",
  "SENDOR",
  "BALTO",
  "PARADOX",
  "LUMIO",
  "CHATTY",
  "NAWS",
  "EZSOL",
  "USDX",
  "DNA",
  "KOLZ",
  "CHINAU",
  "BINK",
  "TOBI",
  "OCTO",
  "WQUIL",
  "ELIZA",
  "ELIZA",
  "WELF",
  "ZEREBRO",
  "D.O.G.E",
  "RNA",
  "RIF",
  "URO",
  "CHEESE",
  "XMW",
  "SIRIUS",
  "TIG",
  "AIXBT",
  "MORPHO",
  "SEKOIA",
  "AGENT",
  "$FLY",
  "HAROLD",
  "GOUT",
  "AVA",
  "BANANAS31",
  "CHILLGUY",
  "CHAMP",
  "MAYA",
  "CROAK",
  "RAVANA",
  "BARA",
  "WHITE",
  "FROX",
  "AIFUN",
  "KAT",
  "PROJECT89",
  "DDBAM",
  "VERTAI",
  "HISS",
  "MGT",
  "ORA",
  "EVAN",
  "MANIFEST",
  "KACY",
  "BABYSOL",
  "EURQ",
  "USDQ",
  "TYPUS",
  "AICELL",
  "AAA",
  "DROP",
  "LOFI",
  "BTCACT",
  "WAWA",
  "HELA",
  "BBC",
  "SLAP",
  "SUGAR",
  "SUL",
  "XAUM",
  "GM",
  "ASPIRIN",
  "PLPA",
  "BONKEY",
  "NAVAL",
  "COBY",
  "STOOS",
  "SEP",
  "SUPRA",
  "CRISPR",
  "L1",
  "FLOWER",
  "DOGEFATHER",
  "SDM",
  "WFI",
  "QF",
  "KEYCAT",
  "BLOB",
  "GLDT",
  "MEY",
  "RIZZMAS",
  "PFROG",
  "BIAO",
  "ASS",
  "XSAT",
  "JORGIE",
  "WSHIDO",
  "CLANKER",
  "YELPE",
  "F",
  "MONET",
  "SIZE",
  "LESLIE",
  "KANGO",
  "LFDOG",
  "SAINT",
  "AGENTFUN",
  "AVA",
  "FAI",
  "PURR",
  "MORTY",
  "TRD",
  "HEEHEE",
  "EMT",
  "LESTER",
  "HOMS",
  "DMT-NAT",
  "MEOW",
  "HGT",
  "XRPETF",
  "SERAPH",
  "SHIRO",
  "FCO",
  "AGRI",
  "RLUSD",
  "RURI",
  "FRIC",
  "BABYXRP",
  "$XRPWIF",
  "GMIX",
  "BOB",
  "LLM",
  "JAK",
  "HAWK",
  "MISATO",
  "LIQQ",
  "REKT",
  "M3M3",
  "LMI",
  "GET",
  "READY",
  "$AKUMA",
  "SANTA",
  "DOPAMINE",
  "PENGU",
  "ALTT",
  "X314",
  "GATO",
  "VAL",
  "GOBI",
  "GO4",
  "PHI",
  "ITHACA",
  "CLEAR",
  "MUSKIT",
  "RAT",
  "PEPE",
  "GOR",
  "MAMU",
  "LUFFY",
  "GRFT",
  "TRUST",
  "UNKOWN",
  "HODI",
  "REALIS",
  "A1X",
  "AIXCB",
  "AFITR",
  "SCIHUB",
  "KENSEI",
  "CATZILLA",
  "BBA",
  "TREEINCAT",
  "BULLY",
  "AUTOS",
  "CULT",
  "PEPEDNA",
  "MYSTERY",
  "TOKI",
  "BSX",
  "FROG",
  "AIMONICA",
  "RAI",
  "KIMBA",
  "RZ",
  "SSSSS",
  "REX",
  "JAV",
  "DUSTY",
  "MONKY",
  "SEND",
  "LAIKA",
  "VANA",
  "BUCK",
  "MOANI",
  "HFUN",
  "PIP",
  "KNOT",
  "SCI",
  "COCA",
  "VNTR",
  "GAME",
  "VADER",
  "CONVO",
  "SERAPH",
  "AIYP",
  "GEMINI",
  "VIRGO",
  "PISCES",
  "LEO",
  "TAURUS",
  "AQUARIUS",
  "CAPRICORN",
  "ARIES",
  "SCORPIO",
  "CANCER",
  "SAGIT",
  "LIBRA",
  "NFTXBT",
  "MUSTAAAAAARD",
  "NEURO",
  "M-BTC",
  "STREAM",
  "USDtb",
  "BOMI",
  "APU",
  "SOLARIS",
  "AIP",
  "CGX",
  "LCAI",
  "LINGO",
  "BRO",
  "TURBO",
  "SFG",
  "INKY",
  "LMT",
  "FARM",
  "WS",
  "FOMO",
  "IFAI",
  "NATO",
  "DRX",
  "BBSNEK",
  "KIP",
  "SKICAT",
  "XYZ",
  "CIRCLE",
  "X",
  "OPAI",
  "SOLID",
  "GRIFFAIN",
  "STARS",
  "ISLAND",
  "MEDXT",
  "ODOS",
  "TRENCHAI",
  "BIO",
  "FURM",
  "FARTCOIN",
  "MOLECULE",
  "SKINUT",
  "SAVE",
  "PEPEC",
  "BGSC",
  "TAOBOT",
  "SHIDO",
  "OXA",
  "STLS",
  "DEPINS",
  "ARMY",
  "TMAI",
  "TAOCAT",
  "RBNT",
  "UFD",
  "YNE",
  "LUIGI",
  "BRETT2.0",
  "BEPE",
  "$1",
  "QAAGAI",
  "ALCH",
  "TEMA",
  "HOODRAT",
  "KIKI",
  "CORGI",
  "DORA",
  "CALLS",
  "GLUTEU",
  "FORKY",
  "LOKY",
  "VU",
  "CERTAI",
  "VIRTU",
  "BOB",
  "OXI",
  "MDTI",
  "BEAR",
  "@G",
  "PHNIX",
  "BEATS",
  "SEN",
  "MUSIC",
  "ARC",
  "SHIFU",
  "ZD",
  "BABYFWOG",
  "SEND",
  "COW",
  "SUCHIR",
  "TAG",
  "FRY",
  "OMG",
  "SAAD",
  "WMC",
  "MINIDOGE",
  "NC",
  "KEKIUS",
  "TRUMPIUS",
  "FLORK",
  "DICKBUTT",
  "CRTAI",
  "LOU",
  "FLOCK",
  "SPORE",
  "SWARMS",
  "DEGENAI",
  "SIMMI",
  "SPECTRA",
  "TCAPY",
  "BRYAN",
  "AVRK",
  "TARDI",
  "METAV",
  "KEKIUS",
  "DESCIAI",
  "DRV",
  "AVB",
  "SHRUBIUS",
  "ROCKET",
  "DEEPSEEKAI",
  "PNDN",
  "XMONEY",
  "TRAI",
  "AVC",
  "SOAR",
  "BNKRS",
  "BABYSHARK",
  "SONIC",
  "OPUS",
  "PIPPIN",
  "OPERATOR",
  "SNAI",
  "BC",
  "COQAI",
  "NEUR",
  "HAT",
  "PUMPAI",
  "WCO",
  "H4CK",
  "ANDY",
  "PEPEAI",
  "GRIFT",
  "KM",
  "ANON",
  "DATBOI",
  "LMY",
  "WAI",
  "NAORIS",
  "AIPUMP",
  "EFFECT",
  "XMONEY",
  "LLM",
  "QUAIN",
  "POM",
  "SAGE",
  "BHC",
  "N2",
  "TRUST",
  "POLY",
  "NOMAI",
  "ACOLYT",
  "DRPXBT",
  "STSHIP",
  "AVAAI",
  "BL",
  "BOTIFY",
  "J",
  "1000X",
  "SENTAI",
  "METANIA",
  "ETF500",
  "SUIDEPIN",
  "BUZZ",
  "GEKKO",
  "WOOF",
  "GUDTEK",
  "BRP",
  "IDX",
  "CATG",
  "JEWELRY",
  "BMT",
  "DUCKAI",
  "PYTHIA",
  "DIGIMON",
  "AGENT S",
  "ASV",
  "TJRM",
  "HINT",
  "QUANTUM",
  "XNL",
  "DEFAI",
  "AION",
  "Q",
  "REM",
  "CHATOSHI",
  "GPS",
  "MY",
  "$LIMBO",
  "WYAC",
  "TREAT",
  "PPCOIN",
  "BDOGITO",
  "asBNB",
  "DUCK",
  "JAIHOZ",
  "BRAIN",
  "NODE",
  "VOLTX",
  "$SYMP",
  "H1DR4",
  "WAGMI",
  "KOGIN",
  "MXNBC",
  "$HOUND",
  "LEO",
  "WIRE",
  "ANIME",
  "GOGLZ",
  "MATES",
  "AGIXBT",
  "YILONGMA",
  "TRUMP",
  "YEET",
  "BUILD",
  "MELANIA",
  "UTHR",
  "AWARE",
  "SKAI",
  "BSOP",
  "PLUME",
  "USDR",
  "SUAI",
  "JAE",
  "AO",
  "PEPO",
  "PX",
  "ONTACT",
  "SPCM",
  "PBTC",
  "LTP",
  "EMYC",
  "MAX",
  "XSEED",
  "VINE",
  "OBT",
  "FARTBOY",
  "L1X",
  "LAYER",
  "BID",
  "CRADLE",
  "SLC",
  "TERRA",
  "ALON",
  "USDF",
  "MXNA",
  "MIA",
  "CAR",
  "BUNKER",
  "SWRX",
  "asUSDF",
  "$AKA",
  "ELON",
  "DOGEMARS",
  "FLOCK",
  "WAR",
  "AGIALPHA",
  "ALPHA",
  "GAMES",
  "LAUNCHCOIN",
  "BTRUMP",
  "M",
  "DEEPSEEK",
  "MARIO",
  "REGENT",
  "BLC",
  "VVV",
  "CONCHO",
  "TREE",
  "SNAKT",
  "EAFIN",
  "LEGIT",
  "DYOR",
  "KARUM",
  "1R0R",
  "OSOL",
  "$REI",
  "JELLYJELLY",
  "EVAL",
  "TOKEN",
  "AAA",
  "EDWIN",
  "RIFT",
  "MEMDEX",
  "TRIP",
  "HENLO",
  "LC",
  "TWIGGY",
  "ELON4AFD",
  "DOGECAUCUS",
  "HOOD",
  "DEEPSEEK",
  "SAN",
  "ANZ",
  "BOOK",
  "STRIKE",
  "JAI",
  "SHY",
  "AINTI",
  "RIZ",
  "32",
  "LYNK",
  "GMRT",
  "XU3O8",
  "KET",
  "SIGN",
  "DOGEAI",
  "MEMHASH",
  "WBERA",
  "PAIN",
  "D223",
  "MA",
  "OMEGA\u200EX",
  "AVAXAI",
  "SOGNI",
  "ETF",
  "HQ",
  "DATA",
  "AVL",
  "EXPERT",
  "ASF",
  "OFT",
  "DOGPU",
  "BDCA",
  "PWOG",
  "PHAR",
  "TST",
  "GROKAI",
  "BEENZ",
  "STUPID",
  "CATTON",
  "AGON",
  "CAR",
  "HONEY",
  "EPT",
  "USDN",
  "BTMETA",
  "SFX",
  "LUX",
  "FDGC",
  "JAILSTOOL",
  "TEVA",
  "B3",
  "BORGY",
  "POLLY",
  "GOKU",
  "PI",
  "NEZHA",
  "GOHOME",
  "NIL",
  "KIMIAI",
  "SHELL",
  "MIU",
  "SLT",
  "RZUSD",
  "STONKS",
  "HEU",
  "USDf",
  "SIXP",
  "HEI",
  "DIAM",
  "SFI",
  "CaptainBNB",
  "CX",
  "DEEP",
  "FAFO",
  "DOOD",
  "BROCCOLI",
  "BROCCOLI",
  "Broccoli",
  "TAPS",
  "A47",
  "TIT",
  "BROCCOLI",
  "KAITO",
  "SIREN",
  "LIBRA",
  "PIAI",
  "GROK3AI",
  "JOC",
  "BUTTCOIN",
  "MARS",
  "CONAN",
  "PIAI",
  "BROCCOLI",
  "BNBXBT",
  "ANT",
  "DRX",
  "WEPE",
  "HVLO",
  "JYAI",
  "SOSO",
  "PERRY",
  "TRUU",
  "OI",
  "SWAN",
  "WOULD",
  "REXBT",
  "CARROT",
  "PAPPLE",
  "UNITREEAI",
  "OIIAOIIA",
  "DNOW",
  "FPIBANK",
  "AQUARI",
  "LCAT",
  "LLD",
  "YALA",
  "WHYPE",
  "INDUSTRIAL",
  "SSE",
  "NVG8",
  "WMON",
  "TUT",
  "BONDX",
  "BREW",
  "PALCOIN",
  "IMG",
  "TRC",
  "BGCI",
  "FROC",
  "STAR10",
  "DOLO",
  "WXTZ",
  "ZORA",
  "UTYA",
  "REACT",
  "COLLAT",
  "XPI",
  "NITRO",
  "PUNDIAI",
  "PWEASE",
  "REALESTATE",
  "SNL",
  "LION",
  "AP3X",
  "SHDX",
  "PEPEMUSK",
  "MT",
  "USDA",
  "GMON",
  "BSAI",
  "YUSD",
  "ELON",
  "SRN",
  "AIV",
  "LF",
  "RCX",
  "1OZT",
  "OIK",
  "SYMM",
  "DDM",
  "WIN",
  "PAWS",
  "SLAY",
  "COCORO",
  "POPG",
  "BUT",
  "PELL",
  "TOOTHLESS",
  "SFRXUSD",
  "FRXUSD",
  "MUBARAK",
  "NXPC",
  "KILO",
  "XP",
  "BR",
  "DOODI",
  "FISHW",
  "KTA",
  "USDO",
  "CUSDO",
  "SHORT",
  "MNSRY",
  "WTFO",
  "MBG",
  "CTH",
  "HYPERSKIDS",
  "GHHS",
  "BUBB",
  "WKEYDAO",
  "PATLU",
  "QUQ",
  "PARTI",
  "TAT",
  "TEM",
  "TITCOIN",
  "ROUTINE",
  "FAT",
  "WAL",
  "MUBARAKAH",
  "GM",
  "AMI",
  "BNB CARD",
  "AFT",
  "HOME",
  "$MVRK",
  "ARIO",
  "BYB",
  "POLLEN",
  "IMGN",
  "JLP",
  "USD1",
  "Ghibli",
  "DIGI",
  "FHE",
  "GUN",
  "AICE",
  "CORN",
  "PUMP",
  "MOSS",
  "DEURO",
  "RFC",
  "ES",
  "UNIBTC",
  "EVA",
  "COLS",
  "MEMEX",
  "KERNEL",
  "Ghibli",
  "VCITY",
  "AGT",
  "Orange Diamond",
  "SOLVEX",
  "APTM",
  "GIZA",
  "BOOGIE",
  "NVB",
  "RWA",
  "PROMPT",
  "DPINO",
  "NUMI",
  "COCORO",
  "FAIR3",
  "CHADETTE",
  "PRAI",
  "XPIN",
  "STKGHO",
  "stkAAVE",
  "BLIFFY",
  "PTC",
  "KULA",
  "PHIL",
  "AQA",
  "ESIM",
  "LUCIC",
  "SUSD",
  "COCORO",
  "LVVA",
  "TITN",
  "OVER",
  "BDTC",
  "SUP",
  "BTR",
  "OBOL",
  "PAPARAZZI",
  "HYPER",
  "BASE",
  "IMT",
  "EDGE",
  "DARK",
  "PUGG",
  "BANK",
  "NATION",
  "TOYSTORY",
  "SKYAI",
  "NILA",
  "ELXAI",
  "BITCH",
  "ATOS",
  "ARI",
  "WIZARD",
  "TROLL",
  "MNTX",
  "MGG",
  "AIOT",
  "$GOLD",
  "8BALL",
  "BRL1",
  "CHIN",
  "DON",
  "CORAL",
  "VGBP",
  "ASTER",
  "RWAI",
  "DOLR",
  "DMCP",
  "LetsBONK",
  "AMBIOS",
  "CHIRP",
  "BTC.\u210F",
  "TRACTOR",
  "B2",
  "GOLDGR",
  "HOSICO",
  "HOUSE",
  "TRENCHER",
  "BOI",
  "BABYBONK",
  "LEMU",
  "ART",
  "HAEDAL",
  "2049",
  "NOBODY",
  "ELDE",
  "BFT",
  "ALF",
  "SATO",
  "$WSOD",
  "SHADOW",
  "gork",
  "Buckazoids",
  "AID",
  "BOOP",
  "TOILET",
  "CUDIS",
  "MAT",
  "AWR",
  "TOKERO",
  "SXT",
  "CLND",
  "MYX",
  "BOOM",
  "BGA",
  "MOONPIG",
  "DONKEY",
  "JAGER",
  "BOOPA",
  "RED",
  "GGEZ1",
  "HYPER",
  "PTEK",
  "GORILLA",
  "CINO",
  "LEARN",
  "BRICS",
  "CIK",
  "TGT",
  "LAIR",
  "AETHUSDT",
  "AETHWETH",
  "BERRY",
  "A",
  "XNPCS",
  "CES",
  "SNS",
  "SWPX",
  "AIX9",
  "GOIDR",
  "RATO",
  "USDX",
  "RZR",
  "GORTH",
  "ACU",
  "NOODLE",
  "GOONC",
  "GNC",
  "EDGEN",
  "GIGGLES",
  "BUDDY",
  "NAIIVE",
  "PUMP",
  "FDC",
  "LA",
  "SLT",
  "DOGEBASE",
  "GASS",
  "FIFA",
  "BOOST",
  "B",
  "MIA",
  "MIRAI",
  "USDN",
  "RIZE",
  "DUPE",
  "SOON",
  "KOKOK",
  "PEPE",
  "A7A5",
  "PETUNIA",
  "LUSD",
  "HP",
  "CAPX",
  "ROVR",
  "MIH",
  "YEE",
  "BOOCHIE",
  "SPK",
  "KOBAN",
  "LANLAN",
  "HUMA",
  "CA",
  "ZEUS",
  "RETARD",
  "MAMBO",
  "GIB",
  "KAKA",
  "E",
  "PACK",
  "allBTC",
  "MAMO",
  "ZEUS",
  "DIS",
  "BEER2",
  "GPT",
  "BTC2",
  "ASRR",
  "MIM",
  "VLR",
  "CRYPTO",
  "NIANNIAN",
  "RDO",
  "FLIGHT",
  "NURA",
  "BROAK",
  "OLIVIA",
  "XPL",
  "FDS",
  "BROWN",
  "CREPE",
  "MIND",
  "S",
  "UZDT",
  "ECOR",
  "COINS",
  "SWOL",
  "YND",
  "TIT",
  "BDG",
  "LOUD",
  "SAHARA",
  "ATTN",
  "ANTS",
  "Z",
  "JOS",
  "CDR",
  "BURN",
  "PEPU",
  "BBOB",
  "CBXRP",
  "CBDOGE",
  "LABUBU",
  "KORI",
  "RESOLV",
  "ZENAI",
  "FLY",
  "JANITOR",
  "PRFI",
  "HAC",
  "$GREMLY",
  "CCDOG",
  "BTX",
  "CRAZY",
  "TRADOOR",
  "MAIV",
  "YBDBD",
  "TIBBIR",
  "SKATE",
  "EUROP",
  "TACC",
  "WSOPH",
  "YETI",
  "$SILVER",
  "EGL1",
  "DUSD",
  "CARTIER",
  "LIFE",
  "SHELL",
  "CHANEL",
  "PATEK",
  "ROLLSROYCE",
  "BULLA",
  "AIN",
  "BOMB",
  "GPU",
  "VERSE",
  "IDOL",
  "JPMORGAN",
  "XBO",
  "TAP",
  "CTYN",
  "SAL",
  "LABUBU",
  "IMAGE",
  "SBET",
  "CRYBB",
  "LIBERTY",
  "LUR",
  "AVM",
  "CAUSE",
  "LAMBO",
  "AXR",
  "GRAY",
  "LBAI",
  "LOCKIN",
  "NAKA",
  "MOOLAH",
  "MASK",
  "BRIC",
  "USELESS",
  "TDE",
  "USD.T",
  "PC",
  "SOLBOX",
  "ESTEE",
  "WAPTM",
  "BEE",
  "COPPER",
  "USDUC",
  "XAVIER",
  "U",
  "TALE",
  "WOOLLY",
  "NEWT",
  "SNPT",
  "CBADA",
  "CBLTC",
  "LOT",
  "SOLX",
  "SN73",
  "SN64",
  "SN5",
  "TASSHUB",
  "SN14",
  "VIBE",
  "KAI",
  "GOR",
  "SN11",
  "SN12",
  "SN13",
  "SN63",
  "SN53",
  "SN56",
  "SN3",
  "VANTA",
  "SN33",
  "SN41",
  "SN44",
  "SN51",
  "SN62",
  "SN9",
  "SN25",
  "SN88",
  "SN47",
  "SN93",
  "SN17",
  "SN4",
  "SN34",
  "SN84",
  "SN10",
  "RITA",
  "DMC",
  "H",
  "ISHI",
  "XNY",
  "MGO",
  "AIV",
  "KNCH",
  "SYMETRAX",
  "MORE",
  "NEX",
  "KITTY",
  "XO",
  "CESS",
  "MORI",
  "BUDDY",
  "CYC",
  "YURU",
  "BJC",
  "GWT",
  "END",
  "WLFI",
  "BINANCIENS",
  "NODE",
  "ECHO",
  "FROGGIE",
  "COINX",
  "PEPEONTRON",
  "NVDAX",
  "AAPLX",
  "OMDB",
  "MSTRX",
  "TSLAX",
  "CRCLX",
  "SPYX",
  "ABTX",
  "ABBVX",
  "ACNX",
  "GOOGLX",
  "AMZNX",
  "AMBRX",
  "KLK",
  "APPX",
  "AZNX",
  "BACX",
  "BRK.BX",
  "AVGOX",
  "CVXX",
  "GMEX",
  "GLDX",
  "GSX",
  "HDX",
  "HONX",
  "INTCX",
  "IBMX",
  "JNJX",
  "JPMX",
  "CSCOX",
  "KOX",
  "CMCSAX",
  "CRWDX",
  "DHRX",
  "DFDVx",
  "LLYX",
  "XOMX",
  "PGX",
  "HOODX",
  "CRMX",
  "TMOX",
  "TQQQX",
  "UNHX",
  "VX",
  "VTIX",
  "WMTX",
  "LINX",
  "MRVLX",
  "MAX",
  "MCDX",
  "MDTX",
  "MRKX",
  "METAX",
  "MSFTX",
  "QQQX",
  "NVOX",
  "ORCLX",
  "NFLXX",
  "PLTRX",
  "PFEX",
  "PEPX",
  "PMX",
  "WBCOIN",
  "ICNT",
  "CETES",
  "QGOLD",
  "GRAMS",
  "XAUT0",
  "PALM",
  "LAIKA",
  "LYP",
  "MANYU",
  "RYS",
  "STOC",
  "PAL",
  "TRIX",
  "ENF",
  "MUSD",
  "CROSS",
  "MOBY",
  "USDCV",
  "AP",
  "BEST",
  "FRAG",
  "QKITTY",
  "TRWA",
  "SESH",
  "PRGN",
  "RS",
  "AIX",
  "RCADE",
  "CC",
  "JU",
  "INI",
  "FCK925",
  "DJI6930",
  "QBIT",
  "MAYA",
  "TAKO",
  "ALT",
  "$OWO",
  "RZR",
  "BBT",
  "MLG",
  "BTCBULL",
  "TANSSI",
  "VELVET",
  "CHILLHOUSE",
  "MRBEAST",
  "MOOMOO",
  "TAIX",
  "DRDR",
  "EMBLEM",
  "G",
  "STARTUP",
  "ZARO",
  "BBBTC",
  "DEGE",
  "FUSD",
  "VSN",
  "MARU",
  "FNA",
  "MOONDOGE",
  "TAC",
  "C",
  "BOMO",
  "RION",
  "USDC.A",
  "XING",
  "NDQ",
  "A2Z",
  "WMDR",
  "WFRAX",
  "BLOCK",
  "BITTY",
  "TOTAKEKE",
  "SMT",
  "KPOP",
  "PTB",
  "ERA",
  "BBFT",
  "HOODOG",
  "ANDREA",
  "\u65FA\u67F4",
  "DOGIMUS",
  "TAKER",
  "BAS",
  "SUPERGROK",
  "GAI",
  "SIGMA",
  "YNG",
  "SBET",
  "BLACK",
  "XPED",
  "BC",
  "VALENTINE",
  "YNUSDX",
  "UPTOP",
  "BIGGIE",
  "ESPORTS",
  "BIGOD",
  "TANUKI",
  "\u54C8\u55BD",
  "TA",
  "MARS",
  "SARAH",
  "SPWR",
  "AIH",
  "ZKWASM",
  "ASP",
  "IKA",
  "OPEN",
  "BABYGROK",
  "TOWN",
  "MARIE",
  "MEMECOIN",
  "XRP2.0",
  "ANI",
  "XAU",
  "LN",
  "MTT",
  "GAIA",
  "LOA",
  "NEKO",
  "ASETQU",
  "MAP",
  "DORA",
  "MOO",
  "ELP",
  "PHY",
  "THINK",
  "HODL",
  "TRIVI",
  "TREE",
  "R1",
  "EURAU",
  "SLIPPY",
  "DELABS",
  "ERN",
  "XSPA",
  "AI4",
  "MINDFAK",
  "URANUS",
  "ASSDAQ",
  "DEBT",
  "BLC",
  "RHEA",
  "XIAOBAI",
  "MAO",
  "PLAY",
  "BNBUSD",
  "SPON",
  "COSMO",
  "NERO",
  "BNKR",
  "SHIB",
  "TPTU",
  "SPORT",
  "BACHI",
  "AIO",
  "DARKSTAR",
  "MARSMI",
  "TOWNS",
  "MM",
  "TETH",
  "LATINA",
  "AU79",
  "ATS",
  "USDU",
  "STAU",
  "PROVE",
  "RICE",
  "WXTM",
  "FIR",
  "IMAGINE",
  "TROLLGE",
  "FARTLESS",
  "IN",
  "X",
  "SPX6969",
  "PM",
  "GLIDR",
  "K",
  "XCX",
  "UPT",
  "MOMO",
  "QTC",
  "AS",
  "RAGEGUY",
  "SOMI",
  "DAM",
  "CPX",
  "FELIS",
  "VMC",
  "SON",
  "MAGAL",
  "ORI",
  "SUSD1+",
  "SCAN",
  "SPACEX",
  "STM",
  "DAN",
  "BPXL",
  "MBGA",
  "ALL",
  "DEUS",
  "BOSS",
  "PUNCHI",
  "XPL",
  "OPENAI",
  "BABYSHARK",
  "CLIFFORD",
  "WAI",
  "XAI",
  "ANTHROPIC",
  "AIBOT",
  "ANDURIL",
  "SKITTEN",
  "PVT",
  "FM",
  "PAI",
  "USDA",
  "ANT",
  "ASC",
  "MEA",
  "KURT",
  "PUBLIC",
  "TOKABU",
  "APD",
  "MOON",
  "TCOM",
  "OPENX",
  "TBLLX",
  "STAR",
  "SHACK",
  "CTM",
  "BNS",
  "USD.F",
  "EAGLE",
  "LOOBY",
  "CLOOTS",
  "IOTAI",
  "SLERF",
  "BFUSD",
  "BRM",
  "AINFT",
  "SYMM",
  "RECON",
  "BABYETH",
  "FOUNDER",
  "LIGHT",
  "1PIECE",
  "EDENA",
  "HODL",
  "RLP",
  "SMCIon",
  "GMEon",
  "IWNon",
  "PBRon",
  "PFEon",
  "GOOGLon",
  "NVOon",
  "ITOTon",
  "HOODon",
  "LINon",
  "ABTon",
  "EFAon",
  "CMGon",
  "ORCLon",
  "PYPLon",
  "QBTSon",
  "RIOTon",
  "MARAon",
  "MUon",
  "PEPon",
  "APPon",
  "LMTon",
  "IBMon",
  "COSTon",
  "IEFAon",
  "IWFon",
  "CRMon",
  "ADBEon",
  "NOWon",
  "SHOPon",
  "AMDon",
  "SPOTon",
  "TSLAon",
  "BLKon",
  "TLTon",
  "NFLXon",
  "EEMon",
  "HIMSon",
  "INTCon",
  "KOon",
  "AAPLon",
  "GSon",
  "UNHon",
  "Von",
  "IAUon",
  "CVXon",
  "LLYon",
  "ABNBon",
  "TMon",
  "COINon",
  "EQIXon",
  "QCOMon",
  "MCDon",
  "ASMLon",
  "IVVon",
  "JDon",
  "RDDTon",
  "MAon",
  "SBUXon",
  "CRCLon",
  "SLVon",
  "NKEon",
  "ARMon",
  "WMTon",
  "PANWon",
  "AVGOon",
  "SNOWon",
  "ACNon",
  "METAon",
  "IWMon",
  "SPYon",
  "TIPon",
  "UBERon",
  "CSCOon",
  "BIDUon",
  "AGGon",
  "PLTRon",
  "SPGIon",
  "TSMon",
  "BABAon",
  "AXPon",
  "DASHon",
  "INTUon",
  "DISon",
  "WFCon",
  "JPMon",
  "AMZNon",
  "IJHon",
  "GEon",
  "MSFTon",
  "SBETon",
  "HYGon",
  "MRVLon",
  "FUTUon",
  "BAon",
  "MSTRon",
  "NVDAon",
  "QQQon",
  "APOon",
  "PGon",
  "MELIon",
  "FIGon",
  "IEMGon",
  "ARIA",
  "mpDAO",
  "BLOB",
  "TOTAKEKE",
  "DGC",
  "AOL",
  "SSX",
  "V",
  "SAPIEN",
  "DGMA",
  "GOONER",
  "TTAJ",
  "UGO",
  "AKE",
  "ALKIMI",
  "DRESS",
  "BTC",
  "SPACE",
  "HYPR",
  "JBC",
  "OMFG",
  "BOATKID",
  "LUMINT",
  "META",
  "MC",
  "YZY",
  "TSLA",
  "NVDA",
  "CRCL",
  "MEFAI",
  "BNB",
  "HEMI",
  "FST",
  "UTT",
  "mUSD",
  "MTP",
  "NXA",
  "SACKS",
  "TAKE",
  "HOKK",
  "TRUTH",
  "SCAM",
  "SILENTIS",
  "MHRD",
  "ADI",
  "DIEM",
  "UCN",
  "STRAYDOG",
  "JUPSOL",
  "CAMP",
  "BABYWLFI",
  "FOMO",
  "BAG",
  "RBR",
  "WOLF",
  "MITO",
  "BABYU",
  "BZIL",
  "BNB",
  "ANOA",
  "XLAB",
  "BANANAGUY",
  "TEN",
  "ARARA",
  "MIDAS",
  "BOMET",
  "FUSAKA",
  "ADA",
  "MMT",
  "SHITCOIN",
  "XL1",
  "PEG",
  "Q",
  "FOREST",
  "SMOON",
  "QST",
  "KEK",
  "ARK",
  "MCH",
  "MCGA",
  "PLANCK",
  "CST",
  "HAUST",
  "BOT",
  "WBAI",
  "CRO",
  "NTE",
  "BNBTIGER",
  "AI3",
  "U",
  "XDOG",
  "USDon",
  "CDL",
  "GATA",
  "ARMY",
  "eMDR",
  "CARDS",
  "SHARDS",
  "MIRROR",
  "CZW",
  "AVNT",
  "FELY",
  "LOOK",
  "HOLO",
  "USDUT",
  "MSVP",
  "MOONCAT",
  "LOLCOIN",
  "POP",
  "SWTCH",
  "FTMX",
  "TDN",
  "RUNWAGO",
  "AVG",
  "STREAMER",
  "XVM",
  "GUSD",
  "USDH",
  "USDHL",
  "ROBOT",
  "JET2",
  "ART",
  "0G",
  "UB",
  "RAIN",
  "PINGPONG",
  "MDDC",
  "PANDU",
  "DOGE-1",
  "MET",
  "FOGO",
  "AA",
  "STBL",
  "PAC",
  "TBC",
  "NIZA",
  "ORGO",
  "T6900",
  "OPENX",
  "ZKC",
  "COPE",
  "EVAA",
  "MRLN",
  "JobIess",
  "$IPAX",
  "OUTLAW",
  "GOLD",
  "USAT",
  "PEP",
  "BUTTPLUG",
  "ABSTER",
  "MAIGA",
  "DL",
  "JOJO",
  "BOLD",
  "BARD",
  "OSK",
  "DGN",
  "STRSZN",
  "RIVER",
  "TUNA",
  "MDC",
  "USAD",
  "ZBT",
  "5PT",
  "AIA",
  "AOP",
  "NETX",
  "VFY",
  "RAGE",
  "CRYPGPT",
  "\u72D7\u72D7\u5E01",
  "CMC20",
  "MOON",
  "LIQUID",
  "CWOIN",
  "TSTON",
  "PORTALS",
  "ETAN",
  "ORBD",
  "GRIPPY",
  "XMN",
  "KO",
  "XMD",
  "PALU",
  "DUST",
  "NOM",
  "BLESS",
  "HOB",
  "HANA",
  "GIGGLE",
  "BLUEY",
  "REGRET",
  "ASTERINU",
  "GAIN",
  "ELIZABETH",
  "BNBCAKE",
  "TMX",
  "XAN",
  "FF",
  "QTO",
  "EDOM",
  "COAI",
  "TENGE",
  "REAL",
  "ASTHERUS",
  "GOATED",
  "MIRA",
  "XRP",
  "BABYCREPE",
  "IRWA",
  "NOS",
  "MERC",
  "RZTO",
  "LIGHT",
  "GG",
  "TIMELESS",
  "UP",
  "KLINK",
  "EDEN",
  "WXPL",
  "2Z",
  "PRICELESS",
  "USDT0",
  "MCQ",
  "QPAY",
  "SZN",
  "STRIKE",
  "LGNS",
  "GOT",
  "AEA",
  "BTG",
  "RP1",
  "PKM",
  "HOLY",
  "CASH+",
  "P",
  "SLX",
  "FT",
  "COINDEPO",
  "YES",
  "GNET",
  "GROYPER",
  "PIPE",
  "CYPR",
  "BTC",
  "KGEN",
  "4",
  "OPAL",
  "LYN",
  "USDAI",
  "BABY4",
  "ADOG",
  "1",
  "CAPY",
  "SAFU",
  "APR",
  "HODL",
  "SP",
  "CRP",
  "MOB",
  "MF",
  "\u8D75\u957F\u5A25",
  "BAN",
  "NOVA",
  "CLASH",
  "OWB",
  "\u5E01\u5B89\u4EBA\u751F",
  "SGI",
  "PALU",
  "BABYBNB",
  "ZERA",
  "XCL",
  "TSAT",
  "TRASH",
  "BTC",
  "SYND",
  "DEW",
  "HARIKO",
  "BABYASTER",
  "SANTA",
  "WBULL",
  "\u5BA2\u670D\u5C0F\u4F55",
  "BELG",
  "CORL",
  "NOICE",
  "\u8CA1\u52D9\u81EA\u7531",
  "USAD",
  "AUDD",
  "DOP2",
  "UP",
  "AXOME",
  "BABYBTC",
  "CLO",
  "KPG",
  "BNBHOLDER",
  "PUP",
  "OLY",
  "NUMMUS",
  "YBNB",
  "NYAN",
  "FUN",
  "LSCAT",
  "BTC",
  "YB",
  "WARD",
  "FLK",
  "BOT",
  "WAGMI",
  "EPWX",
  "TWC",
  "ANOME",
  "NPT",
  "ZIB",
  "ANIMUS",
  "GBNB",
  "ENSO",
  "RECALL",
  "TURTLE",
  "FACY",
  "VFX",
  "BLOXWAP",
  "NUNU",
  "INC",
  "\u54C8\u57FA\u7C73",
  "\u4FEE\u4ED9",
  "ANVL",
  "USCR",
  "USD1",
  "XRB",
  "BTC",
  "CONCILIUM",
  "SVSA",
  "RLS",
  "$SILVER",
  "RVV",
  "FANTC",
  "AYNI",
  "HYDX",
  "PIGGY",
  "$WEN",
  "BLUAI",
  "CGN",
  "DTV",
  "JET",
  "POFU",
  "TORA",
  "COM",
  "SIGMA",
  "ARENA",
  "NUSD",
  "sNUSD",
  "ARES",
  "ON",
  "LMTS",
  "AT",
  "SHIH",
  "CASH",
  "1",
  "WERC",
  "VALOR",
  "FIST",
  "NOCK",
  "GHOST",
  "KAT",
  "MEGA",
  "42",
  "DOGEX",
  "COMMON",
  "PENGO",
  "SHIELD",
  "syrupUSDC",
  "TONXX",
  "BOS",
  "X402",
  "syrupUSDT",
  "PING",
  "MWXT",
  "PAYAI",
  "SANTA",
  "BIGW",
  "DREAMS",
  "AURA",
  "ZARA",
  "AIN",
  "SOLANA",
  "MRDN",
  "VPAY",
  "DPN",
  "LYC",
  "KLIP",
  "KRWQ",
  "EMPI",
  "SPLD",
  "RIVERPTS",
  "IZKY",
  "EAT",
  "NB",
  "SWC",
  "\u4E16\u754C\u548C\u5E73",
  "ZENIX",
  "MM",
  "TTN",
  "CAST",
  "KITE",
  "BAY",
  "LITKEY",
  "SNORT",
  "TYCOON",
  "HAVEN",
  "BEAT",
  "SENTIS",
  "LUX",
  "UAI",
  "MYST",
  "VANKEDISI",
  "PIEVERSE",
  "USDPT",
  "UTOPIA",
  "VOOI",
  "HYBUX",
  "MRLIGHTSPEED",
  "NEO",
  "TRUST",
  "FOLKS",
  "SENT",
  "US",
  "8LNDS",
  "LONG",
  "BCE",
  "WM",
  "ARIAIP",
  "ATONE",
  "AxCNH",
  "AVICI",
  "BMB",
  "KITKAT",
  "DOGE-1",
  "ELIZAOS",
  "BSB",
  "ROI",
  "TOTT",
  "STABLE",
  "FOG",
  "GBCK",
  "DASH",
  "TIMI",
  "SBTC",
  "ALLO",
  "JCT",
  "VBETH",
  "VBUSDC",
  "VBUSDT",
  "RCHV",
  "67",
  "LAMBO",
  "ZUNO",
  "ANY",
  "CBNB",
  "CPT",
  "WOORI",
  "CHECK",
  "PLAY",
  "LUCKY",
  "DEXO",
  "MATTLE",
  "TGBP",
  "ITE",
  "PHOTON",
  "SURGE",
  "USDsui",
  "OOB",
  "RAI",
  "GAIB",
  "EUSX",
  "USX",
  "DGRAM",
  "XMONEY",
  "BOLD",
  "HORSE",
  "BCT",
  "ARTX",
  "MEC",
  "FIGHT",
  "EDEL",
  "RAVE",
  "C1USD",
  "BOB",
  "FROGE",
  "DIGI",
  "SSS",
  "ZEC",
  "DANKDOGE",
  "IRYS",
  "DRG",
  "AUDM",
  "BULLISH",
  "GUA",
  "DSG",
  "TRAIN",
  "\u6076\u4FD7\u4F01\u9E45",
  "GTC",
  "CLONE",
  "XRS",
  "401JK",
  "HPP",
  "REPPO",
  "NCT",
  "XGZ",
  "EDGEAI",
  "ENX",
  "GAIX",
  "SORA",
  "GGBR",
  "BHC",
  "USDG",
  "GIGL",
  "TCU29",
  "KUMA",
  "TOSHI",
  "BEST",
  "ZKP",
  "UMBRA",
  "PALMO",
  "TCT",
  "POWER",
  "OEX",
  "VALAN",
  "$HACHI",
  "WET",
  "BIBI",
  "MOT",
  "ORTA",
  "$GOLD",
  "CFI",
  "SEEK",
  "BXE",
  "TT",
  "CPM",
  "GIGGLE",
  "NIGHT",
  "KNTQ",
  "CYS",
  "KHYPE",
  "MAKA",
  "THQ",
  "ELEVATE",
  "SHOW",
  "ATTRA",
  "ALMANAK",
  "BTX",
  "GTBTC",
  "ANTFUN",
  "DOYR",
  "SOLO",
  "BC400",
  "PAYS",
  "WEALTH",
  "XNT",
  "NPRO",
  "IR",
  "LUNC",
  "U",
  "MAGMA",
  "REAL",
  "LIT",
  "BEB1M",
  "LISA",
  "COCO",
  "OASIS",
  "AMATO",
  "DINO",
  "LV",
  "SCOR",
  "WHITEWHALE",
  "TTD",
  "JOBS",
  "SUPERCYCLE",
  "RTX",
  "PYBOBO",
  "MTHT",
  "BTW",
  "BREV",
  "PRX",
  "DN",
  "KGST",
  "USDKG",
  "FRT",
  "PUSD",
  "KDK",
  "AUDX",
  "NOTHING",
  "COLLECT",
  "SHISA",
  "VAM",
  "BEAR",
  "GYAT",
  "HACHIKO",
  "TBK",
  "ATLAS",
  "TUNA",
  "VK",
  "CPT",
  "COINBANK",
  "BLACKWHALE",
  "USDA",
  "USDM",
  "AIAV",
  "JINDO",
  "PVP",
  "SENT",
  "DUCKY",
  "BOXABL",
  "CODEX",
  "XBRAIN",
  "ESIM",
  "GTETH",
  "FKH",
  "POLLY",
  "BC2",
  "ZTC",
  "TROLL",
  "RADR",
  "AMATon",
  "ABBVon",
  "AALon",
  "ISRGon",
  "BPEPE",
  "BMNRon",
  "BBAIon",
  "FTGCon",
  "BILIon",
  "ACHRon",
  "COPXon",
  "ADIon",
  "JNJon",
  "AMCon",
  "COFon",
  "BZon",
  "CATon",
  "BLSHon",
  "CPNGon",
  "CVNAon",
  "DNNon",
  "KLACon",
  "LIon",
  "OXYon",
  "DGRWon",
  "NIOon",
  "OPRAon",
  "PDBCon",
  "PDDon",
  "SOUNon",
  "Ton",
  "USOon",
  "WULFon",
  "BACon",
  "CEGon",
  "IRENon",
  "NIKLon",
  "RIVNon",
  "TMUSon",
  "TXNon",
  "MTZon",
  "PSQon",
  "REMXon",
  "VTIon",
  "CLOAon",
  "CLOIon",
  "COPon",
  "OPENon",
  "PINSon",
  "VZon",
  "BINCon",
  "Con",
  "NEEon",
  "NTESon",
  "PLUGon",
  "XYZon",
  "GEMIon",
  "GLDon",
  "MRNAon",
  "SCHWon",
  "SOon",
  "XOMon",
  "FIGRon",
  "OSCRon",
  "SOFIon",
  "TQQQon",
  "AMGNon",
  "CRWDon",
  "Fon",
  "JAAAon",
  "TLNon",
  "MPon",
  "TMOon",
  "DBCon",
  "GRABon",
  "OKLOon",
  "RTXon",
  "VTVon",
  "BTGon",
  "CIFRon",
  "PCGon",
  "SQQQon",
  "ANETon",
  "DEon",
  "HDon",
  "LRCXon",
  "PALLon",
  "SGOVon",
  "MRKon",
  "RGTIon",
  "TCOMon",
  "VSTon",
  "LOWon",
  "ONDSon",
  "ONon",
  "SNAPon",
  "USFRon",
  "VRTon",
  "\u8F9B\u666E\u68EE",
  "\u6211\u8E0F\u9A6C\u6765\u4E86",
  "9BIT",
  "DOM",
  "PEPENODE",
  "$LSD",
  "GNK",
  "$ALPHA",
  "MPX",
  "BTL",
  "ZAMA",
  "ZSWAP",
  "\u6B7B\u4E86\u4E48",
  "OWL",
  "CAI",
  "\u8001\u5B50",
  "XAG",
  "XAU",
  "PCT",
  "NRGE",
  "\u96EA\u7403",
  "ROLL",
  "JOBCOIN",
  "PSYOPANIME",
  "NOTIFAI",
  "MEFI",
  "\u9ED1\u9A6C",
  "FIGR_HELOC",
  "ERBB",
  "PFF",
  "ENTROPY",
  "WSOMI",
  "WPEAQ",
  "CJL",
  "WKROWN",
  "\u4EBA\u751FK\u7EBF",
  "PREDIC",
  "XERA",
  "SKR",
  "GAS",
  "GWEI",
  "TRIA",
  "LFUSD",
  "ELSA",
  "IDNG",
  "PF",
  "JACKSON",
  "EV",
  "TU",
  "CLIPPY",
  "TROVE",
  "CNKT+",
  "MIL",
  "AIPF",
  "1",
  "\u54ED\u54ED\u9A6C",
  "USOR",
  "KNT",
  "VEREM",
  "SEAS",
  "SINGULARRY",
  "ARC",
  "THEROS",
  "PIKACHU",
  "XETH",
  "XSOL",
  "MVP",
  "\u5206\u7EA2\u72D7\u5934",
  "XOGE",
  "DADA",
  "IMU",
  "EICOIN",
  "BIOK",
  "DONT",
  "XMR",
  "XAUH",
  "WAR",
  "KABUTO",
  "KABOSU",
  "PENGUIN",
  "memes",
  "2016",
  "BUTTCOIN",
  "CRAT",
  "KIN",
  "(LMX)",
  "21",
  "YOM",
  "WOJAK",
  "XPT",
  "INX",
  "JETUSD",
  "DM",
  "NATGAS",
  "\u4E00",
  "\u5B89",
  "XCU",
  "IXIC",
  "MU",
  "GOOGL",
  "AMZN",
  "INTC",
  "MSTR",
  "S&P500",
  "PLTR",
  "CATCOIN",
  "HOOD",
  "NFLX",
  "GOGE",
  "XPD",
  "ORCL",
  "COIN",
  "OPENAI",
  "BABA",
  "CL",
  "AMD",
  "TSM",
  "AAPL",
  "IWM",
  "MSFT",
  "ANTHROPIC",
  "CRWV",
  "SMH",
  "RIVN",
  "000660",
  "SPCX",
  "005930",
  "XLK",
  "COST",
  "SNDK",
  "LLY",
  "MAGS",
  "BOTZ",
  "META",
  "USAR",
  "USO",
  "URNM",
  "QQQ",
  "COGE",
  "iUSDT",
  "AZTEC",
  "MOLT",
  "MOLTBOOK",
  "EURC",
  "ELON",
  "3KDS",
  "ZIOW",
  "RAILS",
  "CRTR",
  "JWT",
  "SUSDT",
  "DANKDOGEAI",
  "QONE",
  "RNBW",
  "USAD",
  "BILL",
  "CLAWD",
  "CLAWNCH",
  "ESP",
  "FIDD",
  "REAT",
  "X",
  "UP",
  "ETH",
  "BTC",
  "CMR",
  "EUSD",
  "JGGL",
  "SPC",
  "FWX",
  "SUP",
  "OPN",
  "GRANDMA",
  "XPASS",
  "AIAO",
  "AMARA",
  "005380",
  "XBTC",
  "MONSTRO",
  "BTC",
  "IVT",
  "ROU",
  "JUPUSD",
  "BIGTROUT",
  "1FNXAI",
  "USDDD",
  "BCAK",
  "AVLT",
  "YELLOW",
  "LNS",
  "WL",
  "ROBO",
  "IDOS",
  "MOLT",
  "MPP",
  "PUNCH",
  "LOBSTAR",
  "VICPAY",
  "XINGXING",
  "PUNCH",
  "PETAH",
  "$XTC",
  "KIMCHI",
  "MANTRA",
  "PIPPKIN",
  "VBWBTC",
  "META",
  "MSFT",
  "GLD",
  "TSLA",
  "AMZN",
  "SLV",
  "SPY",
  "GOOGL",
  "QQQ",
  "AAPL",
  "HOOD",
  "APP",
  "UNH",
  "CSCO",
  "MOLTID",
  "RDDT",
  "IBM",
  "HPL",
  "GORK",
  "PACT",
  "SHM",
  "HNO",
  "MACMINI",
  "PILL",
  "GPST",
  "EWY",
  "AIBINANCE",
  "DIME",
  "XPGN",
  "TPT",
  "TX",
  "SILVER",
  "PMUSD",
  "TENCENTAI",
  "ZGC",
  "UP",
  "BLEND",
  "SN3",
  "USDTR",
  "URA",
  "BMNR",
  "\u9F99\u867E",
  "ASML",
  "ARSE",
  "GF",
  "ZYLO",
  "PROS",
  "USDGO",
  "EWJ",
  "BP",
  "BINANCEAI",
  "GCOIN",
  "AORA",
  "HODL",
  "OVPP",
  "HOOLI",
  "IWMx",
  "BTBTx",
  "PPLTx",
  "AMDx",
  "BMNRx",
  "COPXx",
  "SCHFx",
  "VTx",
  "SLVx",
  "BTGOx",
  "IEMGx",
  "VELT",
  "STRCX",
  "CZAI",
  "FREEDOMOFMONEY",
  "KNX",
  "AKITA",
  "ONL",
  "EDGE",
  "LRST",
  "PAYP",
  "GPM",
  "MEZO",
  "NOW",
  "SPY",
  "KIMCHI",
  "CAPRon",
  "CIBRon",
  "FSOLon",
  "CRWVon",
  "INCEon",
  "GEVon",
  "GLXYon",
  "HYSon",
  "ASTSon",
  "ENPHon",
  "NEMon",
  "APLDon",
  "ALBon",
  "BNOon",
  "ECHon",
  "COHRon",
  "REGNon",
  "FLHYon",
  "OIHon",
  "ENLVon",
  "FCXon",
  "FFOGon",
  "FXIon",
  "PPLTon",
  "SCCOon",
  "SEDGon",
  "SOXXon",
  "ETNon",
  "GLTRon",
  "LUNRon",
  "VFSon",
  "ETHAon",
  "INDAon",
  "IBITon",
  "VNQon",
  "VRTXon",
  "KWEBon",
  "PAVEon",
  "UNGon",
  "IONQon",
  "STXon",
  "NBISon",
  "NOCon",
  "RDWon",
  "RKLBon",
  "EWYon",
  "EWZon",
  "EXODon",
  "ITAon",
  "QUBTon",
  "UECon",
  "IEFon",
  "SNDKon",
  "URAon",
  "FLQLon",
  "UNPon",
  "WMon",
  "EWJon",
  "FGDLon",
  "SHYon",
  "WDCon",
  "PRL",
  "LOL",
  "OPG",
  "ST",
  "YFSX",
  "BZ",
  "R2",
  "VIN",
  "BINANCEAIPRO",
  "CNS",
  "UUSD",
  "JUNO",
  "TRIAD",
  "BASED",
  "PETS",
  "BTCR",
  "LOL",
  "DUAL",
  "USDB",
  "BULL",
  "EITHER",
  "SOFTWARE.AI",
  "UNT",
  "RIV",
  "BLM",
  "EAT",
  "ROCKET",
  "MAXXING",
  "HANC",
  "PRO",
  "XRPHAI",
  "GENIUS",
  "BRENT",
  "ODIC",
  "PUMPCADE",
  "SLV",
  "SOLIB",
  "UPS",
  "IWC",
  "OFC",
  "NI225",
  "KS200",
  "CTK",
  "BUBI",
  "NEET",
  "VIT",
  "CWU",
  "PDD",
  "SPIKE",
  "CDT",
  "AGC",
  "WATT",
  "CHIP",
  "AVGO",
  "BIRD",
  "XGT",
  "XERO",
  "BPL",
  "KUVI",
  "STAY",
  "ASTEROID",
  "RISE",
  "AI",
  "RISE",
  "RIZO",
  "SLVN",
  "ASTEROID",
  "ALTSZN",
  "DEPLOYR",
  "MYSTERY",
  "wARS",
  "SN46",
  "KAIO",
  "SKIBIDI",
  "flETH",
  "BGBTC",
  "MAGA",
  "RUJI",
  "PS",
  "WZRA",
  "OCT",
  "LOKI",
  "CTR",
  "BELKA",
  "SNC",
  "AASTEROID",
  "ASE",
  "cbMEGA",
  "ASSET",
  "STRCon",
  "PUSD",
  "IMOUT",
  "BABYASTEROID",
  "GME",
  "1810",
  "UPEG",
  "CBRS",
  "QCOM",
  "ASTEROIDOGE",
  "RCON",
  "AIB",
  "BOOB",
  "WADZ",
  "GNOD",
  "USDCX",
  "XLE",
  "LITE",
  "DRAM",
  "MRVL",
  "BX",
  "RKLB",
  "EWZ",
  "CBTC",
  "ASTEROIDFLOKI",
  "EBAY",
  "ZM",
  "SHARE",
  "GICAT",
  "POPMART",
  "MINIMAX",
  "TENCENT",
  "SWEETS",
  "RIAL",
  "SOXL",
  "NEX",
  "MTONGA",
  "DIAMOND",
  "ARX",
  "TEA",
  "SAN",
  "PINX",
  "IBS",
  "ELIEN",
  "FWC",
  "GAYTES",
  "SN59",
  "SN79",
  "SN15",
  "SN75",
  "SN120",
  "SN68",
  "SHLD",
  "WDC",
  "MDOM",
  "WCDOGE",
  "ARM",
  "COHR",
  "HD",
  "UBER",
  "DIS",
  "XFEE",
  "MIM",
  "DAD",
  "GD",
  "PURR",
  "VIRL",
  "ATWO",
  "FLNC",
  "ZEST",
  "USDi",
  "GLW",
  "BINI",
  "JPM",
  "V",
  "WMT",
  "BRKB",
  "UMXM",
  "tSpaceX",
  "USDR",
  "NBIS",
  "MOVA",
  "PEPONK",
  "JAM",
  "EFUN",
  "MANIFEST",
  "ARCANE",
  "ILY",
  "CLIPX",
  "USDI",
  "GEV",
  "B4",
  "SNDKX",
  "UBERX",
  "ARK",
  "ELIZAOK",
  "EWT",
  "RTPBET",
  "\u5C0F\u874C\u86AA",
  "FUTU",
  "SLX",
  "TERMINUS",
  "RBLXX",
  "ETNX",
  "STACCANA",
  "PITCH",
  "QUILL",
  "SAC",
  "WALLI",
  "HOPPY",
  "USDT.c",
  "BE",
  "CRWD",
  "AAOI",
  "INFQ",
  "PLC",
  "MYSTERY",
  "NOK",
  "QAIT",
  "PCAT",
  "ADBEX",
  "SBETX",
  "XLEX",
  "PANWX",
  "TSMX",
  "AMAT",
  "DELL",
  "VRT",
  "RAGEGUY",
  "YLDS",
  "O",
  "QNTX",
  "GULD",
  "NVO",
  "BB",
  "RDW",
  "LUNR",
  "ASTS",
  "RH",
  "NOW",
  "HPE",
  "HIMS",
  "ADBE",
  "CRM",
  "IREN",
  "ONDS",
  "DOGEUS",
  "DOGEUS",
  "RWS",
  "JPYC",
  "TTMI",
  "SPIN",
  "KLACx",
  "SOXXx",
  "SMHx",
  "VRTx",
  "VOOx",
  "SMCIx",
  "SPCEx",
  "SOXLx",
  "HIMSx",
  "GEVx",
  "TERx",
  "RCATx",
  "EWYx",
  "IRENx",
  "ASTSx",
  "PYPLx",
  "AMATx",
  "MUx",
  "LITEx",
  "ASMLx",
  "DELLx",
  "ONDSx",
  "GIVE",
  "HBADG",
  "\u5409\u7965\u9A6C",
  "USDT",
  "PANW",
  "CRDO",
  "AXTI",
  "MUB",
  "CRCLB",
  "TSLAB",
  "NVDAB",
  "SNDKB",
  "SPCXB",
  "SPCXx",
  "DKNG",
  "JMDT",
  "RE",
  "FIFA",
  "SPCX",
  "CIEN",
  "ISRG",
  "UVXY",
  "STX",
  "BEAT",
  "SPCXon",
  "WBRL",
  "TWLO",
  "ROK",
  "SPACEX",
  "SPCX",
  "JW7",
  "BV7X",
  "IDL",
  "FORMon",
  "ATKRon",
  "WOLFon",
  "ICHRon",
  "AAOIon",
  "MXLon",
  "LITEon",
  "TERon",
  "NVTon",
  "GLWon",
  "AEHRon",
  "MTSIon",
  "MYRGon",
  "TELon",
  "HPEon",
  "FLNCon",
  "HIIon",
  "VRSNon",
  "BWETon",
  "ECOon",
  "NUEon",
  "SYMon",
  "BOTZon",
  "ORBXon",
  "ONTOon",
  "TTon",
  "CORZon",
  "IGVon",
  "QYLDon",
  "CRDOon",
  "BAIon",
  "AXTIon",
  "DELLon",
  "FCELon",
  "LSCCon",
  "ACMRon",
  "AMKRon",
  "PLon",
  "ENTGon",
  "STMon",
  "SLBon",
  "BTDRon",
  "SMRon",
  "ARQQon",
  "ROKon",
  "ACLSon",
  "KEELon",
  "UMCon",
  "DGXXon",
  "ALABon",
  "AAONon",
  "POWLon",
  "URNMon",
  "PURRon",
  "KEYSon",
  "UAMYon",
  "IYWon",
  "WMBon",
  "CIENon",
  "AURon",
  "KOPNon",
  "CCJon",
  "VDEon",
  "EXTRon",
  "NATon",
  "DTCRon",
  "HUBBon",
  "BEon",
  "LITon",
  "BOTon",
  "HUTon",
  "AIPon",
  "DRAMon",
  "HIMXon",
  "PENGon",
  "BRLNon",
  "SOXLon",
  "WYFIon",
  "SHLDon",
  "VICRon",
  "NVTSon",
  "CPERon",
  "QTUMon",
  "UCTTon",
  "TENon",
  "SILon",
  "ENBon",
  "GDon",
  "JBLon",
  "SOXSon",
  "LECOon",
  "EMRon",
  "CBRSon",
  "MBLYon",
  "HSAIon",
  "SAPon",
  "TSEMon",
  "AGon",
  "NOKon",
  "FNon",
  "APHon",
  "FLEXon",
  "USARon",
  "OUSTon",
  "LPTHon",
  "PWRon",
  "CLSon",
  "ALAB",
  "POET",
  "BBD",
  "BLOCKS",
  "AOAS",
  "SATAon",
  "ROBOTS",
  "POWER",
  "BUILDOUT",
  "PHOTON",
  "NEOCLOUD",
  "LBM",
  "CAP",
  "MSTRB",
  "AMDB",
  "EWYB",
  "INTCB",
  "AIVO",
  "MAME",
  "ZHIPU",
  "LRCX",
  "KLAC",
  "SMCI",
  "MEBT",
  "KORU",
  "SONY",
  "GCRM",
  "ACP",
  "SBT",
  "STRC",
  "AVV",
  "MVLL",
  "TQQQ",
  "SQQQ",
  "GROVE",
  "TRUEX",
  "TOESCOIN",
  "CATWIF",
  "9984",
  "AATF",
  "GTA",
  "WEN",
  "TSEM",
  "KIOXIA",
  "CNT",
  "SAFA",
  "BELG",
  "SFA",
  "SPAIN",
  "SPCT",
  "BOT",
  "BUU",
  "ASSETFUNDS",
  "HLX",
  "ANSEM",
  "MSFTB",
  "PLTRB",
  "LITEB",
  "METAB",
  "QQQB",
  "rAAPL",
  "rSMCI",
  "rSOXL",
  "rAMD",
  "rMETA",
  "rAMZN",
  "rAVGO",
  "rNVDA",
  "rQQQ",
  "rTSM",
  "rLLY",
  "rMSFT",
  "rIBM",
  "rWDC",
  "rOKLO",
  "rGOOGL",
  "rMRVL",
  "rRGTI",
  "rMU",
  "rDELL",
  "rINTC",
  "rSQQQ",
  "rHOOD",
  "rSOXS",
  "rSIMO",
  "rIREN",
  "rTSLA",
  "rSPY",
  "rCOHR",
  "rFUTU",
  "rCIEN",
  "rCRDO",
  "rAAOI",
  "rCBRS",
  "rMSTR",
  "rTQQQ",
  "rIONQ",
  "rCRCL",
  "rDRAM",
  "rCRWV",
  "rMP",
  "rAMAT",
  "rAXTI",
  "rCLW",
  "rLRCX",
  "preSPCX",
  "rNOW",
  "rEWY",
  "rQBTS",
  "rUSAR",
  "rSNDK",
  "rQCOM",
  "rNBIS",
  "rCOIN",
  "rASML",
  "rSTX",
  "rORCL",
  "rPLTR",
  "rBABA",
  "rBE",
  "rJOBY",
  "preOPAI",
  "rONDS",
  "rNOK",
  "rSOFI",
  "rARM",
  "rLITE",
  "rASTS",
  "rRKLB",
  "rRDW",
  "rSPCX",
  "rANET",
  "DHF",
  "MUU",
  "RAM",
  "BSP",
  "KSTR",
  "TTWO",
  "TER",
  "FLEX",
  "TXN",
  "CAT",
  "NVDA",
  "QQQ",
  "AMD",
  "NFLX",
  "PLTR",
  "TSLA",
  "CRWV",
  "SPY",
  "MSFT",
  "MU",
  "INTC",
  "SNDK",
  "RBLX",
  "AAPL",
  "GME",
  "SLV",
  "CRCL",
  "AMZN",
  "COIN",
  "ASTS",
  "ASML",
  "SHOP",
  "IREN",
  "USO",
  "BABA",
  "BA",
  "DELL",
  "MSTR",
  "LITE",
  "AMAT",
  "TTWO",
  "GOOGL",
  "BE",
  "PENG",
  "COST",
  "TSM",
  "MXL",
  "ORCL",
  "SMCI",
  "NU",
  "RDDT",
  "META",
  "SKHYx",
  "MTHT",
  "KAMIRAI",
  "COINB",
  "SPYB",
  "CBRSB",
  "QCOMB",
  "GOOGLB",
  "SOXLB",
  "GLWB",
  "WDCB",
  "NBISB",
  "DRAMB",
  "GTAVI",
  "TCC",
  "APLD",
  "SIMO",
  "OSCR",
  "UNIC",
  "ASTEROID",
  "SHAZ",
  "SUSDD",
  "CASHCAT",
  "ARROW",
  "SKHYB",
  "GRVT",
  "SNDK",
  "BOT",
  "MU",
  "TAOT",
  "JNJ",
  "PENG",
  "SKHYon",
  "SKHY",
  "INTW",
  "SNXX",
  "XBI",
  "BNC",
  "FWDI",
  "ROB",
  "WEN",
  "SKHY",
  "NRV",
  "GEC",
  "DITAU",
  "VEX",
  "CDXR",
  "88KEY",
  "JOBY",
  "FOX",
  "BXC",
  "SNOW",
  "AAOIB",
  "AVGOB",
  "TSMB",
  "IBMB",
  "MRVLB",
  "RKLBB",
  "HOODB",
  "ARMB",
  "BABAB",
  "NOKB",
  "ALD",
  "KHACN",
  "AIUSD",
  "CXMT",
  "SANTACOIN",
  "INDEX",
  "PEAR",
  "SOXS",
  "TZA",
  "0700",
  "BLACKBEAR",
  "KTI",
  "PEEPS",
  "ZTH",
  "BUZ",
  "SOSANA",
  "AEON",
  "JOTCHUA",
  "AXTIB",
  "KORUB",
  "CRWVB",
  "QNTB",
  "MVLLB",
  "SNXXB",
  "MUUB",
  "ORCLB",
  "INTWB",
  "TQQQB",
  "FONQ",
  "HBULL",
  "CHONKETHA",
  "SOFI",
  "DAVINCI",
  "HOODER",
  "rCSCO",
  "XIAOMI",
  "WOOD",
  "NOCK",
  "BABYHANC",
  "XEF",
  "VLTX",
  "CNX",
  "COSA",
  "DINAR",
  "GME",
  "KET",
  "POL",
  "TMF",
  "TBT",
  "BITO",
  "CATE",
  "GOT2",
  "GD",
  "RM",
  "A",
  "AUG",
  "GLGNS",
  "VES",
  "AI",
  "JIMOTHY",
  "AAPLB",
  "SMHB",
  "AMZNB",
  "SOXSB",
  "DELLB",
  "FLNCB",
  "BEB",
  "GSB",
  "PYPLB",
  "AMATB",
  "PONS",
  "PIPEDOG",
  "OCEAN",
  "PYPL",
  "GS",
  "OKTA",
  "MARSCOIN"
];

// symbols/kucoin_symbols.json
var kucoin_symbols_default = [
  "FET",
  "XMR",
  "ANKR",
  "MTV",
  "CRO",
  "OPT",
  "TT",
  "ATOM",
  "CHR",
  "NIM",
  "COTI",
  "XTZ",
  "BNB",
  "ALGO",
  "ADA",
  "XEM",
  "ZEC",
  "ARPA",
  "CHZ",
  "WIN",
  "THETA",
  "ONE",
  "TFUEL",
  "LUNA",
  "ROOBEE",
  "COS",
  "KPOL",
  "KSM",
  "AXE",
  "STEEM",
  "SENSO",
  "XDB",
  "CADH",
  "JST",
  "STX",
  "COMP",
  "DOT",
  "EWT",
  "PNK",
  "WAVES",
  "SUKU",
  "MLK",
  "DIA",
  "LINK",
  "ALEPH",
  "CKB",
  "UMA",
  "VELO",
  "SUN",
  "YFI",
  "UNI",
  "UOS",
  "SATT",
  "FIL",
  "AAVE",
  "UQC",
  "SHR",
  "ROSE",
  "UST",
  "ETH2",
  "GRT",
  "API3",
  "SUSHI",
  "ALPA",
  "1INCH",
  "HTR",
  "WBTC",
  "HYDRA",
  "CRV",
  "ZEN",
  "MAP2",
  "LRC",
  "KLV",
  "QNT",
  "BAT",
  "DAO",
  "DOGE",
  "CAKE",
  "ORAI",
  "MASK",
  "PHA",
  "AVAX",
  "KRL",
  "SKEY",
  "ORBS",
  "FLUX",
  "SAND",
  "VAI",
  "DODO",
  "PUNDIX",
  "BOSON",
  "HAI",
  "FORTH",
  "GHX",
  "TOWER",
  "XDC",
  "SHIB",
  "ICP",
  "CELO",
  "OGN",
  "GLQ",
  "TLOS",
  "PYR",
  "PROM",
  "EOS3L",
  "EOS3S",
  "ELON",
  "POLS",
  "GMEE",
  "XAVA",
  "SFUND",
  "NFT",
  "AIOZ",
  "LPT",
  "NEAR",
  "CFG",
  "MUSH",
  "SMT",
  "AXS",
  "ROUTE",
  "ERG",
  "SOL",
  "SLP",
  "XCH",
  "MTL",
  "GALAX",
  "QI",
  "XPR",
  "MOVR",
  "WOO",
  "WILD",
  "OXT",
  "BAL",
  "STORJ",
  "YGG",
  "SKL",
  "NMR",
  "TRB",
  "GTC",
  "DYDX",
  "RLC",
  "HBAR",
  "XPRT",
  "EGLD",
  "FLOW",
  "NKN",
  "DMTR",
  "CTSI",
  "ALICE",
  "ILV",
  "BAND",
  "FTT",
  "P2P",
  "DEXE",
  "TLM",
  "RUNE",
  "C98",
  "SIENNA",
  "PUSH",
  "FTM3S",
  "AXS3L",
  "AXS3S",
  "AGLD",
  "NAKA",
  "REEF",
  "TORN",
  "INJ",
  "MATIC3L",
  "MATIC3S",
  "AR",
  "JASMY",
  "CPOOL",
  "SUPER",
  "MTRG",
  "ISP",
  "CERE",
  "PAXG",
  "AUDIO",
  "SAND3L",
  "SAND3S",
  "ENS",
  "ATA",
  "ADX",
  "TWT",
  "MANA3L",
  "MANA3S",
  "GLM",
  "NUM",
  "TRADE",
  "KAVA",
  "LIKE",
  "SFP",
  "RSR",
  "GODS",
  "IMX",
  "VR",
  "POND",
  "MDX",
  "KAIA",
  "CREDI",
  "TRVL",
  "XEC",
  "HEART",
  "GAFI",
  "PEOPLE",
  "IOTA",
  "CWEB",
  "HNT",
  "REVU",
  "GLMR",
  "CTC",
  "ASTR",
  "AMP",
  "CVX",
  "XNO",
  "MARS4",
  "METIS",
  "APE",
  "GMT",
  "BICO",
  "STG",
  "BNC",
  "CFX",
  "XCN",
  "T",
  "ALPINE",
  "NYM",
  "SPA",
  "SWFTC",
  "CELR",
  "AURORA",
  "ELITEHERO",
  "SIN",
  "SYS",
  "OVR",
  "BRISE",
  "AKT",
  "FITFI",
  "BOBA",
  "XRACER",
  "BFC",
  "MBL",
  "DUSK",
  "CCD",
  "USDD",
  "SCRT",
  "ACH",
  "GMT3L",
  "GMT3S",
  "LUNC",
  "USTC",
  "IDLENFT",
  "OP",
  "ICX",
  "USDP",
  "WELL",
  "CSPR",
  "FORT",
  "WEMIX",
  "LDO",
  "FIDA",
  "XRD",
  "PIKASTER2",
  "RVN",
  "SWEAT",
  "PIX",
  "ETHW",
  "00",
  "ASTROBOY",
  "GMX",
  "POKT",
  "APT",
  "EUL",
  "GRAM",
  "HFT",
  "AZERO",
  "NAVI",
  "OSMO",
  "FLR",
  "BDX",
  "MAGIC",
  "RPL",
  "HIGH",
  "OP2L",
  "OP2S",
  "APT2L",
  "APT2S",
  "AGIX2L",
  "AGIX2S",
  "GRT2L",
  "GRT2S",
  "FLOKI",
  "BLUR",
  "WAXL",
  "SSV",
  "ACS",
  "BLUR2L",
  "BLUR2S",
  "CFX2L",
  "CFX2S",
  "SYN",
  "BLZ",
  "MINA",
  "NXRA",
  "HMND",
  "LQTY",
  "STRAX",
  "ARB",
  "ID",
  "ID3L",
  "ID3S",
  "MYRIA",
  "SD",
  "AGI",
  "CGPT",
  "SXPUP",
  "SXPDOWN",
  "MASKUP",
  "MASKDOWN",
  "DYDXUP",
  "DYDXDOWN",
  "OTK",
  "RNDRUP",
  "STXUP",
  "STXDOWN",
  "LINAUP",
  "LINADOWN",
  "ZPAY",
  "PZP",
  "BABYDOGE",
  "ETCUP",
  "ETCDOWN",
  "LOCUS",
  "SUI",
  "KAS",
  "CTSIUP",
  "CTSIDOWN",
  "ICPUP",
  "ICPDOWN",
  "PEPE",
  "CETUS",
  "AIDOGE",
  "MONG",
  "TURBO",
  "LMWR",
  "TURBOS",
  "FLOKIUP",
  "FLOKIDOWN",
  "KAVAUP",
  "KAVADOWN",
  "ZILUP",
  "WOOUP",
  "ZILDOWN",
  "WOODOWN",
  "FILUP",
  "FILDOWN",
  "LUNAUP",
  "LUNADOWN",
  "ARPAUP",
  "ARPADOWN",
  "FETUP",
  "FETDOWN",
  "OCEANUP",
  "OCEANDOWN",
  "ALGOUP",
  "ALGODOWN",
  "LADYS",
  "VERSE",
  "OBI",
  "EDU",
  "ORDI",
  "VOLT",
  "SEI",
  "XEN",
  "MAV",
  "PENDLE",
  "COMPUP",
  "COMPDOWN",
  "MKRUP",
  "MKRDOWN",
  "LYX",
  "DCK",
  "WLD",
  "UNFIUP",
  "UNFIDOWN",
  "TRBUP",
  "TRBDOWN",
  "PYUSD",
  "GLMRUP",
  "GLMRDOWN",
  "ISLM",
  "BIGTIME",
  "ARKM",
  "STORJUP",
  "STORJDOWN",
  "LOOMUP",
  "LOOMDOWN",
  "TIA",
  "CYBER",
  "MEME",
  "TOKEN",
  "POL",
  "SATS",
  "PYTH",
  "RATS",
  "FLIP",
  "BONK",
  "POLYX",
  "MNT",
  "INSP",
  "AUCTION",
  "JTO",
  "VANRY",
  "BAKEUP",
  "BAKEDOWN",
  "COQ",
  "TAO",
  "ARTY",
  "OPUP",
  "OPDOWN",
  "MYRO",
  "RAY",
  "ALEX",
  "XAI",
  "NFP",
  "MANTA",
  "ORCA",
  "KACE",
  "NEON",
  "ONDO",
  "WIF",
  "SAROS",
  "GTAI",
  "KALT",
  "ZETA",
  "DEFI",
  "JUP",
  "WEN",
  "BMX",
  "MAVIA",
  "DYM",
  "NAVX",
  "STRK",
  "BCUT",
  "PIXEL",
  "AGIXUP",
  "AGIXDOWN",
  "QORPO",
  "PORTAL",
  "SCA",
  "HTX",
  "NIBI",
  "AEVO",
  "BOME",
  "ETHFI",
  "MPC",
  "ZKJ",
  "GMRX",
  "VENOM",
  "ENA",
  "USDE",
  "W",
  "AERO",
  "TRUF",
  "MEW",
  "ZEUS",
  "G3",
  "TNSR",
  "ESE",
  "SQR",
  "FOXY",
  "PRCL",
  "MAPO",
  "MERL",
  "DEGEN",
  "KARRAT",
  "VINU",
  "LL",
  "ZBCN",
  "SAFE",
  "RIO",
  "REZ",
  "KMNO",
  "WSDM",
  "CTA",
  "BB",
  "NOT",
  "DRIFT",
  "SQD",
  "MONPRO",
  "LKI",
  "TAIKO",
  "BRETT",
  "IO",
  "OORT",
  "ATH",
  "UNA",
  "ARTFI",
  "COOKIE",
  "ZK",
  "BLAST",
  "ZRO",
  "LISTA",
  "NRN",
  "NATIX",
  "ZEX",
  "MOG",
  "DOP",
  "ANYONE",
  "XR",
  "MOCA",
  "BANANA",
  "AVAIL",
  "CXT",
  "L3",
  "G",
  "RENDER",
  "DOGS",
  "CAT",
  "POPCAT",
  "ORDER",
  "SUNDOG",
  "CHO",
  "CATI",
  "RMV",
  "NEIROCTO",
  "SKY",
  "BFT",
  "HMSTR",
  "MOODENG",
  "EIGEN",
  "CARV",
  "PONKE",
  "HIPPO",
  "WMTX",
  "PUFFER",
  "DEEP",
  "DBR",
  "X",
  "SCR",
  "GOAT",
  "GRASS",
  "PHIL",
  "ACTSOL",
  "COW",
  "SWELL",
  "PEAQ",
  "PNUT",
  "NS",
  "LUMIA",
  "HSK",
  "NPC",
  "MEMEFI",
  "BAN",
  "MORPHO",
  "MAJOR",
  "RWA",
  "WOD",
  "READY",
  "SYRUP",
  "SUPRA",
  "CHILLGUY",
  "VERONA",
  "VIRTUAL",
  "TOSHI",
  "CHEQ",
  "SPX",
  "U2U",
  "AVAAI",
  "GIGA",
  "F",
  "ME",
  "HYPE",
  "MOVE",
  "ZEREBRO",
  "BLUE",
  "HOLD",
  "LINGO",
  "KOMA",
  "STREAM",
  "USUAL",
  "ISLAND",
  "PENGU",
  "ITHACA",
  "FUEL",
  "HPOS10I",
  "FARTCOIN",
  "EYWA",
  "FB",
  "PURR",
  "GRIFFAIN",
  "AIXBT",
  "MILADYCULT",
  "REKT",
  "BIO",
  "LAVA",
  "ARCSOL",
  "SONIC",
  "EMYC",
  "SWARMS",
  "VANA",
  "GAMEAI",
  "XTER",
  "ACX",
  "CLOUD",
  "PAAL",
  "RONIN",
  "LOFI",
  "D",
  "NC",
  "DUCK",
  "S",
  "SOLV",
  "GPS",
  "J",
  "CHIRP",
  "OBT",
  "TRUMP",
  "MELANIA",
  "PLUME",
  "ALU",
  "ANIME",
  "SLC",
  "VINE",
  "VVV",
  "JELLYJELLY",
  "BERA",
  "DATA",
  "TSTBSC",
  "CHEEMS",
  "SFI",
  "LAYER",
  "DIN",
  "HEI",
  "XOXO",
  "RIZ",
  "KAITO",
  "B3",
  "REACT",
  "SHELL",
  "FWOG",
  "ROAM",
  "HONEY",
  "REDSTONE",
  "LVVA",
  "EPIC",
  "MUBARAK",
  "BMT",
  "TUT",
  "SIREN",
  "BR",
  "NIL",
  "PARTI",
  "WAL",
  "KILO",
  "GUN",
  "ZND",
  "STO",
  "TAI",
  "KERNEL",
  "BABY",
  "PROMPT",
  "WCT",
  "HYPER",
  "ZORA",
  "INIT",
  "DOLO",
  "CLANKER",
  "TROLL",
  "HAEDAL",
  "SIGN",
  "B2",
  "SXT",
  "HOUSE",
  "SHM",
  "DOOD",
  "USELESS",
  "NXPC",
  "PRAI",
  "GIZA",
  "SOON",
  "AWE",
  "AGT",
  "USD1",
  "HUMA",
  "A",
  "SOPH",
  "LAT",
  "B",
  "EDGEN",
  "PRO",
  "LA",
  "FLOCK",
  "SKATE",
  "HOME",
  "RESOLV",
  "BULLA",
  "GOMINING",
  "SPK",
  "MAT",
  "H",
  "MGO",
  "DMC",
  "NEWT",
  "SAHARA",
  "CESS",
  "XAUT",
  "LOT",
  "NODE",
  "ECHO",
  "ICNT",
  "CROSS",
  "AIN",
  "BLUM",
  "MORI",
  "VELVET",
  "ES",
  "PUMP",
  "C",
  "VSN",
  "RION",
  "ERA",
  "MANYU",
  "AI3",
  "XU3O8",
  "ASP",
  "XNY",
  "ELP",
  "A47",
  "URANUS",
  "TREE",
  "IKA",
  "GAIA",
  "NOBODY",
  "AIO",
  "SUP",
  "TOWNS",
  "PROVE",
  "IN",
  "DSYNC",
  "SNEK",
  "PROPS",
  "PUBLIC",
  "ALKIMI",
  "EGL1",
  "AKE",
  "BLOCKST",
  "SAPIEN",
  "ARIA",
  "BAS",
  "XPIN",
  "BERT",
  "BTR",
  "CAMP",
  "XLAB",
  "WLFI",
  "Q",
  "SOMI",
  "PTB",
  "UNION",
  "RARI",
  "ART",
  "OPEN",
  "SWTCH",
  "AVNT",
  "LINEA",
  "POP",
  "HOLO",
  "UB",
  "ZKC",
  "COLS",
  "XL1",
  "PORTALS",
  "BARD",
  "0G",
  "NUMI",
  "XAN",
  "GAIN",
  "ASTER",
  "PIN",
  "XPL",
  "STBL",
  "VFY",
  "HANA",
  "MIRA",
  "LIGHT",
  "FF",
  "EDEN",
  "TRUTH",
  "2Z",
  "P",
  "CYPR",
  "MF",
  "LYN",
  "KGEN",
  "KLINK",
  "PIPE",
  "GIGGLE",
  "NOM",
  "CLO",
  "LAB",
  "XMN",
  "FLK",
  "ANOME",
  "ENSO",
  "WBAI",
  "YB",
  "RECALL",
  "ZBT",
  "RVV",
  "BLUAI",
  "TURTLE",
  "MET",
  "LMTS",
  "EQTY",
  "COMMON",
  "IAG",
  "PIGGY",
  "EAT",
  "BOS",
  "PUNDIAI",
  "BEAT",
  "KITE",
  "TEAFI",
  "PLAI",
  "MMT",
  "CC",
  "TRUST",
  "UAI",
  "FOLKS",
  "ELIZAOS",
  "APR",
  "JCT",
  "ALLO",
  "SUT",
  "MON",
  "BOB",
  "PLAY",
  "IRYS",
  "USDG",
  "STABLE",
  "NIGHT",
  "WET",
  "ADI",
  "KYO",
  "US",
  "CYS",
  "ZIG",
  "UDS",
  "THQ",
  "IR",
  "SCOR",
  "VOOI",
  "ZKP",
  "MIN",
  "LIT",
  "BTG",
  "ESIM",
  "RAIN",
  "BREV",
  "ZTC",
  "DN",
  "BNRENSHENG",
  "FOGO",
  "FUN",
  "ULTIMA",
  "FRAX",
  "ELSA",
  "ACU",
  "SKR",
  "GWEI",
  "IMU",
  "FIGHT",
  "SENT",
  "ZAMA",
  "NOLAN",
  "SPACE",
  "PYBOBO",
  "MEZO",
  "BIRB",
  "KIN",
  "PVT",
  "INX",
  "WARD",
  "TRIA",
  "MOVA",
  "RNBW",
  "9BIT",
  "UP",
  "ESP",
  "AZTEC",
  "BNKR",
  "CRTR",
  "ROBO",
  "IDOS",
  "NOON",
  "GF",
  "MANTRA",
  "NEXI",
  "SN3",
  "KAT",
  "XAUM",
  "ION",
  "PRL",
  "WL",
  "BASED",
  "EDGE",
  "USDS",
  "OFC",
  "ACN",
  "RAVE",
  "CHIP",
  "STAY",
  "BLEND",
  "PROS",
  "AKITA",
  "AI",
  "ASSET",
  "BABYSHARK",
  "MEGA",
  "GENIUS",
  "BILL",
  "TAC",
  "METADAO",
  "KAIO",
  "SHARE",
  "HPP",
  "NXT",
  "HOOLI",
  "ATWO",
  "ZEST",
  "NEX",
  "PIEVERSE",
  "ESPORTS",
  "CTR",
  "DEUS",
  "STAR",
  "WALLI",
  "QAIT",
  "TEA",
  "YOM",
  "KONET",
  "U",
  "O",
  "ILY",
  "RE",
  "ARX",
  "UMXM",
  "NES",
  "CAP",
  "GROVE",
  "ANTFUN",
  "CARDS",
  "ANSEM",
  "CASHCAT",
  "BANK",
  "TAG",
  "AEON",
  "GRVT",
  "VSYS",
  "AVA",
  "BAX",
  "BCH",
  "BCHSV",
  "BTC",
  "CVC",
  "DAG",
  "DASH",
  "DCR",
  "DENT",
  "DGB",
  "ELA",
  "ENJ",
  "ETC",
  "ETH",
  "ETN",
  "GAS",
  "IOST",
  "IOTX",
  "KCS",
  "KNC",
  "LSK",
  "LTC",
  "MAN",
  "MANA",
  "NEO",
  "ONT",
  "QKC",
  "QTUM",
  "REQ",
  "SNX",
  "SOUL",
  "TEL",
  "TIME",
  "TRAC",
  "TRX",
  "TUSD",
  "USDC",
  "USDT",
  "UTK",
  "VET",
  "VTHO",
  "WAN",
  "WAX",
  "XLM",
  "XRP",
  "XYO",
  "ZIL",
  "ZRX",
  "BTT"
];

// node_modules/drizzle-orm/entity.js
var entityKind = /* @__PURE__ */ Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}
__name(is, "is");

// node_modules/drizzle-orm/logger.js
var ConsoleLogWriter = class {
  static {
    __name(this, "ConsoleLogWriter");
  }
  static [entityKind] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
};
var DefaultLogger = class {
  static {
    __name(this, "DefaultLogger");
  }
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
var NoopLogger = class {
  static {
    __name(this, "NoopLogger");
  }
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
};

// node_modules/drizzle-orm/table.utils.js
var TableName = /* @__PURE__ */ Symbol.for("drizzle:Name");

// node_modules/drizzle-orm/table.js
var Schema = /* @__PURE__ */ Symbol.for("drizzle:Schema");
var Columns = /* @__PURE__ */ Symbol.for("drizzle:Columns");
var ExtraConfigColumns = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = /* @__PURE__ */ Symbol.for("drizzle:OriginalName");
var BaseName = /* @__PURE__ */ Symbol.for("drizzle:BaseName");
var IsAlias = /* @__PURE__ */ Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static {
    __name(this, "Table");
  }
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
function getTableName(table) {
  return table[TableName];
}
__name(getTableName, "getTableName");
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}
__name(getTableUniqueName, "getTableUniqueName");

// node_modules/drizzle-orm/column.js
var Column = class {
  static {
    __name(this, "Column");
  }
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static {
    __name(this, "ColumnBuilder");
  }
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
};

// node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static {
    __name(this, "ForeignKeyBuilder");
  }
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  static {
    __name(this, "ForeignKey");
  }
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}
__name(iife, "iife");

// node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
__name(uniqueKeyName, "uniqueKeyName");
var UniqueConstraintBuilder = class {
  static {
    __name(this, "UniqueConstraintBuilder");
  }
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static {
    __name(this, "UniqueOnConstraintBuilder");
  }
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  static {
    __name(this, "UniqueConstraint");
  }
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
__name(parsePgArrayValue, "parsePgArrayValue");
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
__name(parsePgNestedArray, "parsePgNestedArray");
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
__name(parsePgArray, "parsePgArray");
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}
__name(makePgArray, "makePgArray");

// node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  static {
    __name(this, "PgColumnBuilder");
  }
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  static {
    __name(this, "PgColumn");
  }
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static {
    __name(this, "ExtraConfigColumn");
  }
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static {
    __name(this, "IndexedColumn");
  }
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgArrayBuilder");
  }
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  static {
    __name(this, "PgArray");
  }
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray) return a;
    return makePgArray(a);
  }
};

// node_modules/drizzle-orm/pg-core/columns/enum.js
var PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgEnumObjectColumnBuilder");
  }
  static [entityKind] = "PgEnumObjectColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumObjectColumn(
      table,
      this.config
    );
  }
};
var PgEnumObjectColumn = class extends PgColumn {
  static {
    __name(this, "PgEnumObjectColumn");
  }
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
var isPgEnumSym = /* @__PURE__ */ Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
__name(isPgEnum, "isPgEnum");
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgEnumColumnBuilder");
  }
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static {
    __name(this, "PgEnumColumn");
  }
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};

// node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static {
    __name(this, "Subquery");
  }
  static [entityKind] = "Subquery";
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static {
    __name(this, "WithSubquery");
  }
  static [entityKind] = "WithSubquery";
};

// node_modules/drizzle-orm/version.js
var version = "0.45.2";

// node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = /* @__PURE__ */ Symbol.for("drizzle:ViewBaseConfig");

// node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static {
    __name(this, "FakePrimitiveParam");
  }
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
__name(isSQLWrapper, "isSQLWrapper");
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
__name(mergeQueries, "mergeQueries");
var StringChunk = class {
  static {
    __name(this, "StringChunk");
  }
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  static {
    __name(this, "SQL");
  }
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  static {
    __name(this, "Name");
  }
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
__name(isDriverValueEncoder, "isDriverValueEncoder");
var noopDecoder = {
  mapFromDriverValue: /* @__PURE__ */ __name((value) => value, "mapFromDriverValue")
};
var noopEncoder = {
  mapToDriverValue: /* @__PURE__ */ __name((value) => value, "mapToDriverValue")
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  static {
    __name(this, "Param");
  }
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
__name(sql, "sql");
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  __name(empty, "empty");
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  __name(fromList, "fromList");
  sql2.fromList = fromList;
  function raw2(str) {
    return new SQL([new StringChunk(str)]);
  }
  __name(raw2, "raw");
  sql2.raw = raw2;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  __name(join, "join");
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  __name(identifier, "identifier");
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  __name(placeholder2, "placeholder2");
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  __name(param2, "param2");
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    static {
      __name(this, "Aliased");
    }
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  static {
    __name(this, "Placeholder");
  }
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
__name(fillPlaceholders, "fillPlaceholders");
var IsDrizzleView = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static {
    __name(this, "View");
  }
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else if (is(field, Subquery)) {
        decoder = field._.sql.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
__name(mapResultRow, "mapResultRow");
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased) || is(field, Subquery)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
__name(orderSelectedFields, "orderSelectedFields");
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index2, key] of leftKeys.entries()) {
    if (key !== rightKeys[index2]) {
      return false;
    }
  }
  return true;
}
__name(haveSameKeys, "haveSameKeys");
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
__name(mapUpdateSet, "mapUpdateSet");
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
__name(applyMixins, "applyMixins");
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
__name(getTableColumns, "getTableColumns");
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
__name(getTableLikeName, "getTableLikeName");
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
__name(getColumnNameAndConfig, "getColumnNameAndConfig");
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();

// node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys = /* @__PURE__ */ Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = /* @__PURE__ */ Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
  static {
    __name(this, "PgTable");
  }
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [Table.Symbol.ExtraConfigColumns] = {};
};

// node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder = class {
  static {
    __name(this, "PrimaryKeyBuilder");
  }
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
var PrimaryKey = class {
  static {
    __name(this, "PrimaryKey");
  }
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
__name(bindIfParam, "bindIfParam");
var eq = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
}, "eq");
var ne = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
}, "ne");
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
__name(and, "and");
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
__name(or, "or");
function not(condition) {
  return sql`not ${condition}`;
}
__name(not, "not");
var gt = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
}, "gt");
var gte = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
}, "gte");
var lt = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
}, "lt");
var lte = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
}, "lte");
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
__name(inArray, "inArray");
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
__name(notInArray, "notInArray");
function isNull(value) {
  return sql`${value} is null`;
}
__name(isNull, "isNull");
function isNotNull(value) {
  return sql`${value} is not null`;
}
__name(isNotNull, "isNotNull");
function exists(subquery) {
  return sql`exists ${subquery}`;
}
__name(exists, "exists");
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
__name(notExists, "notExists");
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
__name(between, "between");
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
__name(notBetween, "notBetween");
function like(column, value) {
  return sql`${column} like ${value}`;
}
__name(like, "like");
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
__name(notLike, "notLike");
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
__name(ilike, "ilike");
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}
__name(notIlike, "notIlike");

// node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
__name(asc, "asc");
function desc(column) {
  return sql`${column} desc`;
}
__name(desc, "desc");

// node_modules/drizzle-orm/relations.js
var Relation = class {
  static {
    __name(this, "Relation");
  }
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
};
var Relations = class {
  static {
    __name(this, "Relations");
  }
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
};
var One = class _One extends Relation {
  static {
    __name(this, "One");
  }
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = class _Many extends Relation {
  static {
    __name(this, "Many");
  }
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
__name(getOperators, "getOperators");
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
__name(getOrderByOperators, "getOrderByOperators");
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
__name(extractTablesRelationalConfig, "extractTablesRelationalConfig");
function createOne(sourceTable) {
  return /* @__PURE__ */ __name(function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  }, "one");
}
__name(createOne, "createOne");
function createMany(sourceTable) {
  return /* @__PURE__ */ __name(function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  }, "many");
}
__name(createMany, "createMany");
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
__name(normalizeRelation, "normalizeRelation");
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
__name(createTableRelationsHelpers, "createTableRelationsHelpers");
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}
__name(mapRelationalRow, "mapRelationalRow");

// node_modules/drizzle-orm/alias.js
var ColumnAliasProxyHandler = class {
  static {
    __name(this, "ColumnAliasProxyHandler");
  }
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
var TableAliasProxyHandler = class {
  static {
    __name(this, "TableAliasProxyHandler");
  }
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
var RelationTableAliasProxyHandler = class {
  static {
    __name(this, "RelationTableAliasProxyHandler");
  }
  constructor(alias) {
    this.alias = alias;
  }
  static [entityKind] = "RelationTableAliasProxyHandler";
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
__name(aliasedTable, "aliasedTable");
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
__name(aliasedTableColumn, "aliasedTableColumn");
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
__name(mapColumnsInAliasedSQLToAlias, "mapColumnsInAliasedSQLToAlias");
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}
__name(mapColumnsInSQLToAlias, "mapColumnsInSQLToAlias");

// node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler = class _SelectionProxyHandler {
  static {
    __name(this, "SelectionProxyHandler");
  }
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};

// node_modules/drizzle-orm/query-promise.js
var QueryPromise = class {
  static {
    __name(this, "QueryPromise");
  }
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};

// node_modules/drizzle-orm/sqlite-core/foreign-keys.js
var ForeignKeyBuilder2 = class {
  static {
    __name(this, "ForeignKeyBuilder");
  }
  static [entityKind] = "SQLiteForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate;
  /** @internal */
  _onDelete;
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey2(table, this);
  }
};
var ForeignKey2 = class {
  static {
    __name(this, "ForeignKey");
  }
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "SQLiteForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// node_modules/drizzle-orm/sqlite-core/unique-constraint.js
function uniqueKeyName2(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
__name(uniqueKeyName2, "uniqueKeyName");
var UniqueConstraintBuilder2 = class {
  static {
    __name(this, "UniqueConstraintBuilder");
  }
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "SQLiteUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  build(table) {
    return new UniqueConstraint2(table, this.columns, this.name);
  }
};
var UniqueOnConstraintBuilder2 = class {
  static {
    __name(this, "UniqueOnConstraintBuilder");
  }
  static [entityKind] = "SQLiteUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder2(columns, this.name);
  }
};
var UniqueConstraint2 = class {
  static {
    __name(this, "UniqueConstraint");
  }
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName2(this.table, this.columns.map((column) => column.name));
  }
  static [entityKind] = "SQLiteUniqueConstraint";
  columns;
  name;
  getName() {
    return this.name;
  }
};

// node_modules/drizzle-orm/sqlite-core/columns/common.js
var SQLiteColumnBuilder = class extends ColumnBuilder {
  static {
    __name(this, "SQLiteColumnBuilder");
  }
  static [entityKind] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder2(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
};
var SQLiteColumn = class extends Column {
  static {
    __name(this, "SQLiteColumn");
  }
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName2(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "SQLiteColumn";
};

// node_modules/drizzle-orm/sqlite-core/columns/blob.js
var SQLiteBigIntBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBigIntBuilder");
  }
  static [entityKind] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
};
var SQLiteBigInt = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBigInt");
  }
  static [entityKind] = "SQLiteBigInt";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return BigInt(buf.toString("utf8"));
    }
    return BigInt(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
};
var SQLiteBlobJsonBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBlobJsonBuilder");
  }
  static [entityKind] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobJson(
      table,
      this.config
    );
  }
};
var SQLiteBlobJson = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBlobJson");
  }
  static [entityKind] = "SQLiteBlobJson";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return JSON.parse(buf.toString("utf8"));
    }
    return JSON.parse(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
};
var SQLiteBlobBufferBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBlobBufferBuilder");
  }
  static [entityKind] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
};
var SQLiteBlobBuffer = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBlobBuffer");
  }
  static [entityKind] = "SQLiteBlobBuffer";
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
};
function blob(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}
__name(blob, "blob");

// node_modules/drizzle-orm/sqlite-core/columns/custom.js
var SQLiteCustomColumnBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteCustomColumnBuilder");
  }
  static [entityKind] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new SQLiteCustomColumn(
      table,
      this.config
    );
  }
};
var SQLiteCustomColumn = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteCustomColumn");
  }
  static [entityKind] = "SQLiteCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
};
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(
      name,
      config,
      customTypeParams
    );
  };
}
__name(customType, "customType");

// node_modules/drizzle-orm/sqlite-core/columns/integer.js
var SQLiteBaseIntegerBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBaseIntegerBuilder");
  }
  static [entityKind] = "SQLiteBaseIntegerBuilder";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
};
var SQLiteBaseInteger = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBaseInteger");
  }
  static [entityKind] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
};
var SQLiteIntegerBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteIntegerBuilder");
  }
  static [entityKind] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(
      table,
      this.config
    );
  }
};
var SQLiteInteger = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteInteger");
  }
  static [entityKind] = "SQLiteInteger";
};
var SQLiteTimestampBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteTimestampBuilder");
  }
  static [entityKind] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  /**
   * @deprecated Use `default()` with your own expression instead.
   *
   * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
   */
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(
      table,
      this.config
    );
  }
};
var SQLiteTimestamp = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteTimestamp");
  }
  static [entityKind] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1e3);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1e3);
    }
    return unix;
  }
};
var SQLiteBooleanBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteBooleanBuilder");
  }
  static [entityKind] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(
      table,
      this.config
    );
  }
};
var SQLiteBoolean = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteBoolean");
  }
  static [entityKind] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
};
function integer(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}
__name(integer, "integer");

// node_modules/drizzle-orm/sqlite-core/columns/numeric.js
var SQLiteNumericBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericBuilder");
  }
  static [entityKind] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumeric(
      table,
      this.config
    );
  }
};
var SQLiteNumeric = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumeric");
  }
  static [entityKind] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
};
var SQLiteNumericNumberBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericNumberBuilder");
  }
  static [entityKind] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericNumber(
      table,
      this.config
    );
  }
};
var SQLiteNumericNumber = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumericNumber");
  }
  static [entityKind] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
};
var SQLiteNumericBigIntBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericBigIntBuilder");
  }
  static [entityKind] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericBigInt(
      table,
      this.config
    );
  }
};
var SQLiteNumericBigInt = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumericBigInt");
  }
  static [entityKind] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
};
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}
__name(numeric, "numeric");

// node_modules/drizzle-orm/sqlite-core/columns/real.js
var SQLiteRealBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteRealBuilder");
  }
  static [entityKind] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  /** @internal */
  build(table) {
    return new SQLiteReal(table, this.config);
  }
};
var SQLiteReal = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteReal");
  }
  static [entityKind] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
};
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}
__name(real, "real");

// node_modules/drizzle-orm/sqlite-core/columns/text.js
var SQLiteTextBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteTextBuilder");
  }
  static [entityKind] = "SQLiteTextBuilder";
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  /** @internal */
  build(table) {
    return new SQLiteText(
      table,
      this.config
    );
  }
};
var SQLiteText = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteText");
  }
  static [entityKind] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
};
var SQLiteTextJsonBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteTextJsonBuilder");
  }
  static [entityKind] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteTextJson(
      table,
      this.config
    );
  }
};
var SQLiteTextJson = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteTextJson");
  }
  static [entityKind] = "SQLiteTextJson";
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
};
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}
__name(text, "text");

// node_modules/drizzle-orm/sqlite-core/columns/all.js
function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer,
    numeric,
    real,
    text
  };
}
__name(getSQLiteColumnBuilders, "getSQLiteColumnBuilders");

// node_modules/drizzle-orm/sqlite-core/table.js
var InlineForeignKeys2 = /* @__PURE__ */ Symbol.for("drizzle:SQLiteInlineForeignKeys");
var SQLiteTable = class extends Table {
  static {
    __name(this, "SQLiteTable");
  }
  static [entityKind] = "SQLiteTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys: InlineForeignKeys2
  });
  /** @internal */
  [Table.Symbol.Columns];
  /** @internal */
  [InlineForeignKeys2] = [];
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
};
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys2].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
__name(sqliteTableBase, "sqliteTableBase");
var sqliteTable = /* @__PURE__ */ __name((name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
}, "sqliteTable");

// node_modules/drizzle-orm/sqlite-core/indexes.js
var IndexBuilderOn = class {
  static {
    __name(this, "IndexBuilderOn");
  }
  constructor(name, unique) {
    this.name = name;
    this.unique = unique;
  }
  static [entityKind] = "SQLiteIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(this.name, columns, this.unique);
  }
};
var IndexBuilder = class {
  static {
    __name(this, "IndexBuilder");
  }
  static [entityKind] = "SQLiteIndexBuilder";
  /** @internal */
  config;
  constructor(name, columns, unique) {
    this.config = {
      name,
      columns,
      unique,
      where: void 0
    };
  }
  /**
   * Condition for partial index.
   */
  where(condition) {
    this.config.where = condition;
    return this;
  }
  /** @internal */
  build(table) {
    return new Index(this.config, table);
  }
};
var Index = class {
  static {
    __name(this, "Index");
  }
  static [entityKind] = "SQLiteIndex";
  config;
  constructor(config, table) {
    this.config = { ...config, table };
  }
};
function index(name) {
  return new IndexBuilderOn(name, false);
}
__name(index, "index");

// node_modules/drizzle-orm/sqlite-core/utils.js
function extractUsedTable(table) {
  if (is(table, SQLiteTable)) {
    return [`${table[Table.Symbol.BaseName]}`];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}
__name(extractUsedTable, "extractUsedTable");

// node_modules/drizzle-orm/sqlite-core/query-builders/delete.js
var SQLiteDeleteBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteDeleteBase");
  }
  constructor(table, session, dialect, withList) {
    super();
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "SQLiteDelete";
  /** @internal */
  config;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "delete",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute(placeholderValues) {
    return this._prepare().execute(placeholderValues);
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
__name(toSnakeCase, "toSnakeCase");
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
__name(toCamelCase, "toCamelCase");
function noopCase(input) {
  return input;
}
__name(noopCase, "noopCase");
var CasingCache = class {
  static {
    __name(this, "CasingCache");
  }
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName) return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
};

// node_modules/drizzle-orm/errors.js
var DrizzleError = class extends Error {
  static {
    __name(this, "DrizzleError");
  }
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
var DrizzleQueryError = class _DrizzleQueryError extends Error {
  static {
    __name(this, "DrizzleQueryError");
  }
  constructor(query, params, cause) {
    super(`Failed query: ${query}
params: ${params}`);
    this.query = query;
    this.params = params;
    this.cause = cause;
    Error.captureStackTrace(this, _DrizzleQueryError);
    if (cause) this.cause = cause;
  }
};
var TransactionRollbackError = class extends DrizzleError {
  static {
    __name(this, "TransactionRollbackError");
  }
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
};

// node_modules/drizzle-orm/sqlite-core/view-base.js
var SQLiteViewBase = class extends View {
  static {
    __name(this, "SQLiteViewBase");
  }
  static [entityKind] = "SQLiteViewBase";
};

// node_modules/drizzle-orm/sqlite-core/dialect.js
var SQLiteDialect = class {
  static {
    __name(this, "SQLiteDialect");
  }
  static [entityKind] = "SQLiteDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new CasingCache(config?.casing);
  }
  escapeName(name) {
    return `"${name.replace(/"/g, '""')}"`;
  }
  escapeParam(_num) {
    return "?";
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length) return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({
    table,
    where,
    returning,
    withList,
    limit,
    orderBy
  }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(
      columnNames.flatMap((colName, i) => {
        const col = tableColumns[colName];
        const onUpdateFnResult = col.onUpdateFn?.();
        const value = set[colName] ?? (is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col));
        const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
        if (i < setSize - 1) {
          return [res, sql.raw(", ")];
        }
        return [res];
      })
    );
  }
  buildUpdateQuery({
    table,
    set,
    where,
    returning,
    withList,
    joins,
    from,
    limit,
    orderBy
  }) {
    const withSql = this.buildWithCTE(withList);
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}update ${table} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, Column)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        const tableName = field.table[Table.Symbol.Name];
        if (field.columnType === "SQLiteNumericBigInt") {
          if (isSingleTable) {
            chunk.push(
              sql`cast(${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          } else {
            chunk.push(
              sql`cast(${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          }
        } else {
          if (isSingleTable) {
            chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
          } else {
            chunk.push(
              sql`${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))}`
            );
          }
        }
      } else if (is(field, Subquery)) {
        const entries = Object.entries(field._.selectedFields);
        if (entries.length === 1) {
          const entry = entries[0][1];
          const fieldDecoder = is(entry, SQL) ? entry.decoder : is(entry, Column) ? { mapFromDriverValue: /* @__PURE__ */ __name((v) => entry.mapFromDriverValue(v), "mapFromDriverValue") } : entry.sql.decoder;
          if (fieldDecoder) field._.sql.decoder = fieldDecoder;
        }
        chunk.push(field);
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    if (joins) {
      for (const [index2, joinMeta] of joins.entries()) {
        if (index2 === 0) {
          joinsArray.push(sql` `);
        }
        const table = joinMeta.table;
        const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : void 0;
        if (is(table, SQLiteTable)) {
          const tableName = table[SQLiteTable.Symbol.Name];
          const tableSchema = table[SQLiteTable.Symbol.Schema];
          const origTableName = table[SQLiteTable.Symbol.OriginalName];
          const alias = tableName === origTableName ? void 0 : joinMeta.alias;
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(
              origTableName
            )}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
          );
        } else {
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${table}${onSql}`
          );
        }
        if (index2 < joins.length - 1) {
          joinsArray.push(sql` `);
        }
      }
    }
    return sql.join(joinsArray);
  }
  buildLimit(limit) {
    return typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
  }
  buildOrderBy(orderBy) {
    const orderByList = [];
    if (orderBy) {
      for (const [index2, orderByValue] of orderBy.entries()) {
        orderByList.push(orderByValue);
        if (index2 < orderBy.length - 1) {
          orderByList.push(sql`, `);
        }
      }
    }
    return orderByList.length > 0 ? sql` order by ${sql.join(orderByList)}` : void 0;
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.IsAlias]) {
      return sql`${sql`${sql.identifier(table[Table.Symbol.Schema] ?? "")}.`.if(table[Table.Symbol.Schema])}${sql.identifier(
        table[Table.Symbol.OriginalName]
      )} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, SQLiteViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join(
            "->"
          )}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    const distinctSql = distinct ? sql` distinct` : void 0;
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    const groupByList = [];
    if (groupBy) {
      for (const [index2, groupByValue] of groupBy.entries()) {
        groupByList.push(groupByValue);
        if (index2 < groupBy.length - 1) {
          groupByList.push(sql`, `);
        }
      }
    }
    const groupBySql = groupByList.length > 0 ? sql` group by ${sql.join(groupByList)}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`${leftSelect.getSQL()} `;
    const rightChunk = sql`${rightSelect.getSQL()}`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, SQLiteColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, SQLiteColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(
                this.casing.getColumnCasing(chunk)
              );
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({
    table,
    values: valuesOrSelect,
    onConflict,
    returning,
    withList,
    select
  }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(
      ([_, col]) => !col.shouldDisableInsert()
    );
    const insertOrder = colEntries.map(([, column]) => sql.identifier(this.casing.getColumnCasing(column)));
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            let defaultValue;
            if (col.default !== null && col.default !== void 0) {
              defaultValue = is(col.default, SQL) ? col.default : sql.param(col.default, col);
            } else if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              defaultValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
            } else {
              defaultValue = sql`null`;
            }
            valueList.push(defaultValue);
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict?.length ? sql.join(onConflict) : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${valuesSql}${onConflictSql}${returningSql}`;
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      invokeSource
    });
  }
  buildRelationalQuery({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [
          key,
          aliasedTableColumn(value, tableAlias)
        ])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter(
            (key) => !selectedColumns.includes(key)
          );
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter(
          (entry) => !!entry[1]
        ).map(([tsKey, queryConfig]) => ({
          tsKey,
          queryConfig,
          relation: tableConfig.relations[tsKey]
        }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(
          schema,
          tableNamesMap,
          relation
        );
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(
                normalizedRelation.references[i],
                relationTableAlias
              ),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQuery({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`(${builtRelation.sql})`.as(selectedRelationTsKey);
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({
        message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
      });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_array(${sql.join(
        selection.map(
          ({ field: field2 }) => is(field2, SQLiteColumn) ? sql.identifier(this.casing.getColumnCasing(field2)) : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_group_array(${field}), json_array())`;
      }
      const nestedSelection = [
        {
          dbKey: "data",
          tsKey: "data",
          field: field.as("data"),
          isJson: true,
          relationTableTsKey: tableConfig.tsName,
          selection
        }
      ];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [
            {
              path: [],
              field: sql.raw("*")
            }
          ],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = void 0;
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, SQLiteTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};
var SQLiteSyncDialect = class extends SQLiteDialect {
  static {
    __name(this, "SQLiteSyncDialect");
  }
  static [entityKind] = "SQLiteSyncDialect";
  migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    session.run(migrationTableCreate);
    const dbMigrations = session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    session.run(sql`BEGIN`);
    try {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            session.run(sql.raw(stmt));
          }
          session.run(
            sql`INSERT INTO ${sql.identifier(
              migrationsTable
            )} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
      session.run(sql`COMMIT`);
    } catch (e) {
      session.run(sql`ROLLBACK`);
      throw e;
    }
  }
};
var SQLiteAsyncDialect = class extends SQLiteDialect {
  static {
    __name(this, "SQLiteAsyncDialect");
  }
  static [entityKind] = "SQLiteAsyncDialect";
  async migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    await session.run(migrationTableCreate);
    const dbMigrations = await session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    await session.transaction(async (tx) => {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.run(sql.raw(stmt));
          }
          await tx.run(
            sql`INSERT INTO ${sql.identifier(
              migrationsTable
            )} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
};

// node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder = class {
  static {
    __name(this, "TypedQueryBuilder");
  }
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/select.js
var SQLiteSelectBuilder = class {
  static {
    __name(this, "SQLiteSelectBuilder");
  }
  static [entityKind] = "SQLiteSelectBuilder";
  fields;
  session;
  dialect;
  withList;
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    this.withList = config.withList;
    this.distinct = config.distinct;
  }
  from(source) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(source, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(source._.selectedFields).map((key) => [key, source[key]])
      );
    } else if (is(source, SQLiteViewBase)) {
      fields = source[ViewBaseConfig].selectedFields;
    } else if (is(source, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(source);
    }
    return new SQLiteSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    });
  }
};
var SQLiteSelectQueryBuilderBase = class extends TypedQueryBuilder {
  static {
    __name(this, "SQLiteSelectQueryBuilderBase");
  }
  static [entityKind] = "SQLiteSelectQueryBuilder";
  _;
  /** @internal */
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  cacheConfig = void 0;
  usedTables = /* @__PURE__ */ new Set();
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields,
      config: this.config
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
    for (const item of extractUsedTable(table)) this.usedTables.add(item);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(joinType) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left");
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right");
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner");
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full");
  /**
   * Executes a `cross join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
   *
   * @param table the table to join.
   *
   * @example
   *
   * ```ts
   * // Select all users, each user with every pet
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets)
   * ```
   */
  crossJoin = this.createJoin("cross");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getSQLiteSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/sqlite-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/sqlite-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/sqlite-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/sqlite-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    const usedTables = [];
    usedTables.push(...extractUsedTable(this.config.table));
    if (this.config.joins) {
      for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
    }
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
};
var SQLiteSelectBase = class extends SQLiteSelectQueryBuilderBase {
  static {
    __name(this, "SQLiteSelectBase");
  }
  static [entityKind] = "SQLiteSelect";
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    if (!this.session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const fieldsList = orderSelectedFields(this.config.fields);
    const query = this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      fieldsList,
      "all",
      true,
      void 0,
      {
        type: "select",
        tables: [...this.usedTables]
      },
      this.cacheConfig
    );
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  $withCache(config) {
    this.cacheConfig = config === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config };
    return this;
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.all();
  }
};
applyMixins(SQLiteSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
__name(createSetOperator, "createSetOperator");
var getSQLiteSetOperators = /* @__PURE__ */ __name(() => ({
  union,
  unionAll,
  intersect,
  except
}), "getSQLiteSetOperators");
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var except = createSetOperator("except", false);

// node_modules/drizzle-orm/sqlite-core/query-builders/query-builder.js
var QueryBuilder = class {
  static {
    __name(this, "QueryBuilder");
  }
  static [entityKind] = "SQLiteQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, SQLiteDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, SQLiteDialect) ? void 0 : dialect;
  }
  $with = /* @__PURE__ */ __name((alias, selection) => {
    const queryBuilder = this;
    const as = /* @__PURE__ */ __name((qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    }, "as");
    return { as };
  }, "$with");
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    __name(select, "select");
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries,
        distinct: true
      });
    }
    __name(selectDistinct, "selectDistinct");
    return { select, selectDistinct };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new SQLiteSyncDialect(this.dialectConfig);
    }
    return this.dialect;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/insert.js
var SQLiteInsertBuilder = class {
  static {
    __name(this, "SQLiteInsertBuilder");
  }
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteInsertBuilder";
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new SQLiteInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new SQLiteInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
};
var SQLiteInsertBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteInsertBase");
  }
  constructor(table, values, session, dialect, withList, select) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select };
  }
  static [entityKind] = "SQLiteInsert";
  /** @internal */
  config;
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (!this.config.onConflict) this.config.onConflict = [];
    if (config.target === void 0) {
      this.config.onConflict.push(sql` on conflict do nothing`);
    } else {
      const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
      const whereSql = config.where ? sql` where ${config.where}` : sql``;
      this.config.onConflict.push(sql` on conflict ${targetSql} do nothing${whereSql}`);
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    if (!this.config.onConflict) this.config.onConflict = [];
    const whereSql = config.where ? sql` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
    const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
    this.config.onConflict.push(
      sql` on conflict ${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`
    );
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/update.js
var SQLiteUpdateBuilder = class {
  static {
    __name(this, "SQLiteUpdateBuilder");
  }
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteUpdateBuilder";
  set(values) {
    return new SQLiteUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    );
  }
};
var SQLiteUpdateBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteUpdateBase");
  }
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
  }
  static [entityKind] = "SQLiteUpdate";
  /** @internal */
  config;
  from(source) {
    this.config.from = source;
    return this;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from ? is(table, SQLiteTable) ? table[Table.Symbol.Columns] : is(table, Subquery) ? table._.selectedFields : is(table, SQLiteViewBase) ? table[ViewBaseConfig].selectedFields : void 0 : void 0;
        on = on(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/count.js
var SQLiteCountBuilder = class _SQLiteCountBuilder extends SQL {
  static {
    __name(this, "SQLiteCountBuilder");
  }
  constructor(params) {
    super(_SQLiteCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.session = params.session;
    this.sql = _SQLiteCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  static [entityKind] = "SQLiteCountBuilderAsync";
  [Symbol.toStringTag] = "SQLiteCountBuilderAsync";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters}`;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/query.js
var RelationalQueryBuilder = class {
  static {
    __name(this, "RelationalQueryBuilder");
  }
  constructor(mode, fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.mode = mode;
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "SQLiteAsyncRelationalQueryBuilder";
  findMany(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
};
var SQLiteRelationalQuery = class extends QueryPromise {
  static {
    __name(this, "SQLiteRelationalQuery");
  }
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  static [entityKind] = "SQLiteAsyncRelationalQuery";
  /** @internal */
  mode;
  /** @internal */
  getSQL() {
    return this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    }).sql;
  }
  /** @internal */
  _prepare(isOneTimeQuery = false) {
    const { query, builtQuery } = this._toSQL();
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      builtQuery,
      void 0,
      this.mode === "first" ? "get" : "all",
      true,
      (rawRows, mapColumnValue) => {
        const rows = rawRows.map(
          (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
        );
        if (this.mode === "first") {
          return rows[0];
        }
        return rows;
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  _toSQL() {
    const query = this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  /** @internal */
  executeRaw() {
    if (this.mode === "first") {
      return this._prepare(false).get();
    }
    return this._prepare(false).all();
  }
  async execute() {
    return this.executeRaw();
  }
};
var SQLiteSyncRelationalQuery = class extends SQLiteRelationalQuery {
  static {
    __name(this, "SQLiteSyncRelationalQuery");
  }
  static [entityKind] = "SQLiteSyncRelationalQuery";
  sync() {
    return this.executeRaw();
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/raw.js
var SQLiteRaw = class extends QueryPromise {
  static {
    __name(this, "SQLiteRaw");
  }
  constructor(execute, getSQL, action, dialect, mapBatchResult) {
    super();
    this.execute = execute;
    this.getSQL = getSQL;
    this.dialect = dialect;
    this.mapBatchResult = mapBatchResult;
    this.config = { action };
  }
  static [entityKind] = "SQLiteRaw";
  /** @internal */
  config;
  getQuery() {
    return { ...this.dialect.sqlToQuery(this.getSQL()), method: this.config.action };
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
};

// node_modules/drizzle-orm/sqlite-core/db.js
var BaseSQLiteDatabase = class {
  static {
    __name(this, "BaseSQLiteDatabase");
  }
  constructor(resultKind, dialect, session, schema) {
    this.resultKind = resultKind;
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {}
    };
    this.query = {};
    const query = this.query;
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        query[tableName] = new RelationalQueryBuilder(
          resultKind,
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
    this.$cache = { invalidate: /* @__PURE__ */ __name(async (_params) => {
    }, "invalidate") };
  }
  static [entityKind] = "BaseSQLiteDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = /* @__PURE__ */ __name((alias, selection) => {
    const self = this;
    const as = /* @__PURE__ */ __name((qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self.dialect));
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    }, "as");
    return { as };
  }, "$with");
  $count(source, filters) {
    return new SQLiteCountBuilder({ source, filters, session: this.session });
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    __name(select, "select");
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    __name(selectDistinct, "selectDistinct");
    function update(table) {
      return new SQLiteUpdateBuilder(table, self.session, self.dialect, queries);
    }
    __name(update, "update");
    function insert(into) {
      return new SQLiteInsertBuilder(into, self.session, self.dialect, queries);
    }
    __name(insert, "insert");
    function delete_(from) {
      return new SQLiteDeleteBase(from, self.session, self.dialect, queries);
    }
    __name(delete_, "delete_");
    return { select, selectDistinct, update, insert, delete: delete_ };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: this.session, dialect: this.dialect });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new SQLiteUpdateBuilder(table, this.session, this.dialect);
  }
  $cache;
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(into) {
    return new SQLiteInsertBuilder(into, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(from) {
    return new SQLiteDeleteBase(from, this.session, this.dialect);
  }
  run(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.run(sequel),
        () => sequel,
        "run",
        this.dialect,
        this.session.extractRawRunValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.run(sequel);
  }
  all(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.all(sequel),
        () => sequel,
        "all",
        this.dialect,
        this.session.extractRawAllValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.all(sequel);
  }
  get(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.get(sequel),
        () => sequel,
        "get",
        this.dialect,
        this.session.extractRawGetValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.get(sequel);
  }
  values(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.values(sequel),
        () => sequel,
        "values",
        this.dialect,
        this.session.extractRawValuesValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.values(sequel);
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
};

// node_modules/drizzle-orm/cache/core/cache.js
var Cache = class {
  static {
    __name(this, "Cache");
  }
  static [entityKind] = "Cache";
};
var NoopCache = class extends Cache {
  static {
    __name(this, "NoopCache");
  }
  strategy() {
    return "all";
  }
  static [entityKind] = "NoopCache";
  async get(_key) {
    return void 0;
  }
  async put(_hashedQuery, _response, _tables, _config) {
  }
  async onMutate(_params) {
  }
};
async function hashQuery(sql2, params) {
  const dataToHash = `${sql2}-${JSON.stringify(params)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
__name(hashQuery, "hashQuery");

// node_modules/drizzle-orm/sqlite-core/session.js
var ExecuteResultSync = class extends QueryPromise {
  static {
    __name(this, "ExecuteResultSync");
  }
  constructor(resultCb) {
    super();
    this.resultCb = resultCb;
  }
  static [entityKind] = "ExecuteResultSync";
  async execute() {
    return this.resultCb();
  }
  sync() {
    return this.resultCb();
  }
};
var SQLitePreparedQuery = class {
  static {
    __name(this, "SQLitePreparedQuery");
  }
  constructor(mode, executeMethod, query, cache, queryMetadata, cacheConfig) {
    this.mode = mode;
    this.executeMethod = executeMethod;
    this.query = query;
    this.cache = cache;
    this.queryMetadata = queryMetadata;
    this.cacheConfig = cacheConfig;
    if (cache && cache.strategy() === "all" && cacheConfig === void 0) {
      this.cacheConfig = { enable: true, autoInvalidate: true };
    }
    if (!this.cacheConfig?.enable) {
      this.cacheConfig = void 0;
    }
  }
  static [entityKind] = "PreparedQuery";
  /** @internal */
  joinsNotNullableMap;
  /** @internal */
  async queryWithCache(queryString, params, query) {
    if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.cacheConfig && !this.cacheConfig.enable) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) {
      try {
        const [res] = await Promise.all([
          query(),
          this.cache.onMutate({ tables: this.queryMetadata.tables })
        ]);
        return res;
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (!this.cacheConfig) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.queryMetadata.type === "select") {
      const fromCache = await this.cache.get(
        this.cacheConfig.tag ?? await hashQuery(queryString, params),
        this.queryMetadata.tables,
        this.cacheConfig.tag !== void 0,
        this.cacheConfig.autoInvalidate
      );
      if (fromCache === void 0) {
        let result;
        try {
          result = await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
        await this.cache.put(
          this.cacheConfig.tag ?? await hashQuery(queryString, params),
          result,
          // make sure we send tables that were used in a query only if user wants to invalidate it on each write
          this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
          this.cacheConfig.tag !== void 0,
          this.cacheConfig.config
        );
        return result;
      }
      return fromCache;
    }
    try {
      return await query();
    } catch (e) {
      throw new DrizzleQueryError(queryString, params, e);
    }
  }
  getQuery() {
    return this.query;
  }
  mapRunResult(result, _isFromBatch) {
    return result;
  }
  mapAllResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  mapGetResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  execute(placeholderValues) {
    if (this.mode === "async") {
      return this[this.executeMethod](placeholderValues);
    }
    return new ExecuteResultSync(() => this[this.executeMethod](placeholderValues));
  }
  mapResult(response, isFromBatch) {
    switch (this.executeMethod) {
      case "run": {
        return this.mapRunResult(response, isFromBatch);
      }
      case "all": {
        return this.mapAllResult(response, isFromBatch);
      }
      case "get": {
        return this.mapGetResult(response, isFromBatch);
      }
    }
  }
};
var SQLiteSession = class {
  static {
    __name(this, "SQLiteSession");
  }
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "SQLiteSession";
  prepareOneTimeQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return this.prepareQuery(
      query,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper,
      queryMetadata,
      cacheConfig
    );
  }
  run(query) {
    const staticQuery = this.dialect.sqlToQuery(query);
    try {
      return this.prepareOneTimeQuery(staticQuery, void 0, "run", false).run();
    } catch (err) {
      throw new DrizzleError({ cause: err, message: `Failed to run the query '${staticQuery.sql}'` });
    }
  }
  /** @internal */
  extractRawRunValueFromBatchResult(result) {
    return result;
  }
  all(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).all();
  }
  /** @internal */
  extractRawAllValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  get(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).get();
  }
  /** @internal */
  extractRawGetValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  values(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).values();
  }
  async count(sql2) {
    const result = await this.values(sql2);
    return result[0][0];
  }
  /** @internal */
  extractRawValuesValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
};
var SQLiteTransaction = class extends BaseSQLiteDatabase {
  static {
    __name(this, "SQLiteTransaction");
  }
  constructor(resultType, dialect, session, schema, nestedIndex = 0) {
    super(resultType, dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "SQLiteTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
};

// node_modules/drizzle-orm/d1/session.js
var SQLiteD1Session = class extends SQLiteSession {
  static {
    __name(this, "SQLiteD1Session");
  }
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }
  static [entityKind] = "SQLiteD1Session";
  logger;
  cache;
  prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    const stmt = this.client.prepare(query.sql);
    return new D1PreparedQuery(
      stmt,
      query,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  async batch(queries) {
    const preparedQueries = [];
    const builtQueries = [];
    for (const query of queries) {
      const preparedQuery = query._prepare();
      const builtQuery = preparedQuery.getQuery();
      preparedQueries.push(preparedQuery);
      if (builtQuery.params.length > 0) {
        builtQueries.push(preparedQuery.stmt.bind(...builtQuery.params));
      } else {
        const builtQuery2 = preparedQuery.getQuery();
        builtQueries.push(
          this.client.prepare(builtQuery2.sql).bind(...builtQuery2.params)
        );
      }
    }
    const batchResults = await this.client.batch(builtQueries);
    return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
  }
  extractRawAllValueFromBatchResult(result) {
    return result.results;
  }
  extractRawGetValueFromBatchResult(result) {
    return result.results[0];
  }
  extractRawValuesValueFromBatchResult(result) {
    return d1ToRawMapping(result.results);
  }
  async transaction(transaction, config) {
    const tx = new D1Transaction("async", this.dialect, this, this.schema);
    await this.run(sql.raw(`begin${config?.behavior ? " " + config.behavior : ""}`));
    try {
      const result = await transaction(tx);
      await this.run(sql`commit`);
      return result;
    } catch (err) {
      await this.run(sql`rollback`);
      throw err;
    }
  }
};
var D1Transaction = class _D1Transaction extends SQLiteTransaction {
  static {
    __name(this, "D1Transaction");
  }
  static [entityKind] = "D1Transaction";
  async transaction(transaction) {
    const savepointName = `sp${this.nestedIndex}`;
    const tx = new _D1Transaction("async", this.dialect, this.session, this.schema, this.nestedIndex + 1);
    await this.session.run(sql.raw(`savepoint ${savepointName}`));
    try {
      const result = await transaction(tx);
      await this.session.run(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      await this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
};
function d1ToRawMapping(results) {
  const rows = [];
  for (const row of results) {
    const entry = Object.keys(row).map((k) => row[k]);
    rows.push(entry);
  }
  return rows;
}
__name(d1ToRawMapping, "d1ToRawMapping");
var D1PreparedQuery = class extends SQLitePreparedQuery {
  static {
    __name(this, "D1PreparedQuery");
  }
  constructor(stmt, query, logger, cache, queryMetadata, cacheConfig, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
    super("async", executeMethod, query, cache, queryMetadata, cacheConfig);
    this.logger = logger;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
    this.fields = fields;
    this.stmt = stmt;
  }
  static [entityKind] = "D1PreparedQuery";
  /** @internal */
  customResultMapper;
  /** @internal */
  fields;
  /** @internal */
  stmt;
  async run(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return await this.queryWithCache(this.query.sql, params, async () => {
      return this.stmt.bind(...params).run();
    });
  }
  async all(placeholderValues) {
    const { fields, query, logger, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return await this.queryWithCache(query.sql, params, async () => {
        return stmt.bind(...params).all().then(({ results }) => this.mapAllResult(results));
      });
    }
    const rows = await this.values(placeholderValues);
    return this.mapAllResult(rows);
  }
  mapAllResult(rows, isFromBatch) {
    if (isFromBatch) {
      rows = d1ToRawMapping(rows.results);
    }
    if (!this.fields && !this.customResultMapper) {
      return rows;
    }
    if (this.customResultMapper) {
      return this.customResultMapper(rows);
    }
    return rows.map((row) => mapResultRow(this.fields, row, this.joinsNotNullableMap));
  }
  async get(placeholderValues) {
    const { fields, joinsNotNullableMap, query, logger, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return await this.queryWithCache(query.sql, params, async () => {
        return stmt.bind(...params).all().then(({ results }) => results[0]);
      });
    }
    const rows = await this.values(placeholderValues);
    if (!rows[0]) {
      return void 0;
    }
    if (customResultMapper) {
      return customResultMapper(rows);
    }
    return mapResultRow(fields, rows[0], joinsNotNullableMap);
  }
  mapGetResult(result, isFromBatch) {
    if (isFromBatch) {
      result = d1ToRawMapping(result.results)[0];
    }
    if (!this.fields && !this.customResultMapper) {
      return result;
    }
    if (this.customResultMapper) {
      return this.customResultMapper([result]);
    }
    return mapResultRow(this.fields, result, this.joinsNotNullableMap);
  }
  async values(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return await this.queryWithCache(this.query.sql, params, async () => {
      return this.stmt.bind(...params).raw();
    });
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};

// node_modules/drizzle-orm/d1/driver.js
var DrizzleD1Database = class extends BaseSQLiteDatabase {
  static {
    __name(this, "DrizzleD1Database");
  }
  static [entityKind] = "D1Database";
  async batch(batch) {
    return this.session.batch(batch);
  }
};
function drizzle(client, config = {}) {
  const dialect = new SQLiteAsyncDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new SQLiteD1Session(client, dialect, schema, { logger, cache: config.cache });
  const db = new DrizzleD1Database("async", dialect, session, schema);
  db.$client = client;
  db.$cache = config.cache;
  if (db.$cache) {
    db.$cache["invalidate"] = config.cache?.onMutate;
  }
  return db;
}
__name(drizzle, "drizzle");

// src/db/schema.ts
var CRYPTO_DETAILS = sqliteTable(
  "crypto_details",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    symbol: text("symbol").notNull(),
    market: text("market").notNull(),
    price: real("price").notNull(),
    createdTime: integer("created_time").notNull()
  },
  (table) => [
    index("crypto_index").on(table.symbol, table.market, table.createdTime)
  ]
);
var FAVORITES = sqliteTable(
  "favorites",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    chatId: integer("chat_id").notNull(),
    symbol: text("symbol").notNull()
  },
  (table) => [index("favorites_index").on(table.chatId, table.symbol)]
);

// symbols/unique_symbols.json
var unique_symbols_default = [
  "$1",
  "$AKA",
  "$AKUMA",
  "$ALPHA",
  "$BLUE",
  "$CATALORIAN",
  "$CHIDO",
  "$COFEEE",
  "$DAUMEN",
  "$DICE",
  "$DRF",
  "$DROPEE",
  "$FLY",
  "$FM",
  "$FORGE",
  "$GOLD",
  "$GREMLY",
  "$HACHI",
  "$HOUND",
  "$INA",
  "$IPAX",
  "$JOGECO",
  "$LANDLORD",
  "$LIMBO",
  "$LSD",
  "$MBAG",
  "$MEWING",
  "$MFER",
  "$MICHI",
  "$MICRO",
  "$MONG",
  "$MVRK",
  "$NAP",
  "$OPCAT",
  "$OWO",
  "$PEEP",
  "$PELF",
  "$PURPE",
  "$REI",
  "$SILVER",
  "$SYMP",
  "$TIME",
  "$TOAD",
  "$WAFFLES",
  "$WATER",
  "$WELL",
  "$WEN",
  "$WSOD",
  "$XRPWIF",
  "$XTC",
  "$YAKU",
  "(LMX)",
  "00",
  "000660",
  "005380",
  "005930",
  "0700",
  "0G",
  "0X0",
  "0XBTC",
  "0XGAS",
  "1",
  "1000X",
  "10SET",
  "1810",
  "1CAT",
  "1FNXAI",
  "1INCH",
  "1OZT",
  "1PIECE",
  "1R0R",
  "2016",
  "2049",
  "21",
  "2GIVE",
  "2Z",
  "314DAO",
  "32",
  "3AIR",
  "3CRV",
  "3KDS",
  "3ULL",
  "4",
  "401JK",
  "42",
  "47",
  "4CHAN",
  "4EVER",
  "5PT",
  "67",
  "888",
  "88KEY",
  "8BALL",
  "8LNDS",
  "9984",
  "99BTC",
  "9BIT",
  "9MM",
  "@G",
  "A",
  "A1X",
  "A2Z",
  "A47",
  "A7A5",
  "A8",
  "AA",
  "AAA",
  "AABL",
  "AALON",
  "AAOI",
  "AAOIB",
  "AAOION",
  "AAONON",
  "AAPL",
  "AAPLB",
  "AAPLON",
  "AAPLX",
  "AARK",
  "AART",
  "AAST",
  "AASTEROID",
  "AATF",
  "AAVE",
  "AAX",
  "AB",
  "ABBC",
  "ABBVON",
  "ABBVX",
  "ABC",
  "ABCD",
  "ABDS",
  "ABEL",
  "ABEY",
  "ABI",
  "ABL",
  "ABNBON",
  "ABOND",
  "ABR",
  "ABSTER",
  "ABT",
  "ABTON",
  "ABTX",
  "ABX",
  "ABYSS",
  "ACA",
  "ACCES",
  "ACE",
  "ACES",
  "ACH",
  "ACHI",
  "ACHRON",
  "ACLSON",
  "ACM",
  "ACMRON",
  "ACN",
  "ACNON",
  "ACNX",
  "ACOIN",
  "ACOLYT",
  "ACP",
  "ACPT",
  "ACS",
  "ACT",
  "ACTSOL",
  "ACU",
  "ACX",
  "ADA",
  "ADAPAD",
  "ADBE",
  "ADBEON",
  "ADBEX",
  "ADC",
  "ADDY",
  "ADF",
  "ADI",
  "ADION",
  "ADM",
  "ADO",
  "ADOG",
  "ADOGE",
  "ADP",
  "ADS",
  "ADX",
  "ADZ",
  "AE",
  "AEA",
  "AEG",
  "AEHRON",
  "AEON",
  "AERGO",
  "AERO",
  "AEROBUD",
  "AETHUSDT",
  "AETHWETH",
  "AEUR",
  "AEVO",
  "AEVUM",
  "AFC",
  "AFITR",
  "AFR",
  "AFRO",
  "AFT",
  "AFX",
  "AGC",
  "AGENT",
  "AGENT S",
  "AGENTFUN",
  "AGETH",
  "AGGON",
  "AGI",
  "AGIALPHA",
  "AGIX",
  "AGIX2L",
  "AGIX2S",
  "AGIXBT",
  "AGIXDOWN",
  "AGIXUP",
  "AGLD",
  "AGON",
  "AGRI",
  "AGRS",
  "AGT",
  "AGURI",
  "AGVE",
  "AGX",
  "AHT",
  "AI",
  "AI16Z",
  "AI3",
  "AI4",
  "AIA",
  "AIAO",
  "AIAT",
  "AIAV",
  "AIB",
  "AIBINANCE",
  "AIBOT",
  "AIC",
  "AICE",
  "AICELL",
  "AID",
  "AIDOGE",
  "AIFUN",
  "AIG",
  "AIH",
  "AIKEK",
  "AIM",
  "AIMONICA",
  "AIN",
  "AINFT",
  "AINTI",
  "AINU",
  "AIO",
  "AION",
  "AIOT",
  "AIOZ",
  "AIP",
  "AIPAD",
  "AIPEPE",
  "AIPF",
  "AIPO",
  "AIPON",
  "AIPUMP",
  "AIR",
  "AIRDROP",
  "AIRI",
  "AIRT",
  "AIT",
  "AIUSD",
  "AIV",
  "AIVO",
  "AIX",
  "AIX9",
  "AIXBT",
  "AIXCB",
  "AIYP",
  "AJNA",
  "AKE",
  "AKI",
  "AKITA",
  "AKT",
  "AL",
  "ALA",
  "ALAB",
  "ALABON",
  "ALAN",
  "ALB",
  "ALBON",
  "ALCH",
  "ALCX",
  "ALD",
  "ALE",
  "ALEO",
  "ALEPH",
  "ALEX",
  "ALF",
  "ALGO",
  "ALGODOWN",
  "ALGOUP",
  "ALI",
  "ALIAS",
  "ALICE",
  "ALIEN",
  "ALKIMI",
  "ALL",
  "ALLBTC",
  "ALLO",
  "ALM",
  "ALMANAK",
  "ALON",
  "ALOT",
  "ALPA",
  "ALPACA",
  "ALPH",
  "ALPHA",
  "ALPINE",
  "ALT",
  "ALTS",
  "ALTSZN",
  "ALTT",
  "ALU",
  "ALUSD",
  "ALVA",
  "AM",
  "AMA",
  "AMAPT",
  "AMARA",
  "AMAT",
  "AMATB",
  "AMATO",
  "AMATON",
  "AMATX",
  "AMAZINGTEAM",
  "AMB",
  "AMBER",
  "AMBIOS",
  "AMBRX",
  "AMC",
  "AMCON",
  "AMD",
  "AMDB",
  "AMDON",
  "AMDX",
  "AME",
  "AMERICA",
  "AMETA",
  "AMGNON",
  "AMI",
  "AMKRON",
  "AMKT",
  "AMN",
  "AMO",
  "AMP",
  "AMPL",
  "AMPLE",
  "AMS",
  "AMT",
  "AMZN",
  "AMZNB",
  "AMZNON",
  "AMZNX",
  "ANALOS",
  "ANDREA",
  "ANDURIL",
  "ANDWU",
  "ANDY",
  "ANETON",
  "ANG",
  "ANI",
  "ANIMA",
  "ANIME",
  "ANIMUS",
  "ANK",
  "ANKR",
  "ANKRBNB",
  "ANKRETH",
  "ANOA",
  "ANOME",
  "ANON",
  "ANR",
  "ANSEM",
  "ANT",
  "ANTFUN",
  "ANTHROPIC",
  "ANTS",
  "ANUS",
  "ANVL",
  "ANY",
  "ANYONE",
  "ANZ",
  "AO",
  "AOAS",
  "AOC",
  "AOG",
  "AOL",
  "AOP",
  "AORA",
  "AP",
  "AP3X",
  "APD",
  "APE",
  "APED",
  "APEPE",
  "APEWIFHAT",
  "APEX",
  "APHON",
  "API3",
  "APLD",
  "APLDON",
  "APOON",
  "APP",
  "APPLE",
  "APPON",
  "APPX",
  "APR",
  "APRIL",
  "APT",
  "APT2L",
  "APT2S",
  "APTM",
  "APU",
  "APW",
  "APX",
  "APYS",
  "AQA",
  "AQT",
  "AQUA",
  "AQUARI",
  "AQUARIUS",
  "AR",
  "ARARA",
  "ARB",
  "ARBUZ",
  "ARC",
  "ARCANE",
  "ARCH",
  "ARCONA",
  "ARCSOL",
  "ARCT",
  "ARDR",
  "ARDX",
  "AREA",
  "ARENA",
  "ARES",
  "ARG",
  "ARGUS",
  "ARI",
  "ARIA",
  "ARIA20",
  "ARIAIP",
  "ARIES",
  "ARIO",
  "ARK",
  "ARKM",
  "ARM",
  "ARMB",
  "ARMON",
  "ARMY",
  "ARPA",
  "ARPADOWN",
  "ARPAUP",
  "ARQ",
  "ARQQON",
  "ARROW",
  "ARRR",
  "ARSE",
  "ART",
  "ARTFI",
  "ARTX",
  "ARTY",
  "ARV",
  "ARW",
  "ARX",
  "AS",
  "ASAFE",
  "ASBNB",
  "ASC",
  "ASE",
  "ASEED",
  "ASETQU",
  "ASF",
  "ASH",
  "ASIA",
  "ASK",
  "ASM",
  "ASML",
  "ASMLON",
  "ASMLX",
  "ASP",
  "ASPIRIN",
  "ASPO",
  "ASR",
  "ASRR",
  "ASS",
  "ASSDAQ",
  "ASSET",
  "ASSETFUNDS",
  "AST",
  "ASTER",
  "ASTERINU",
  "ASTEROID",
  "ASTEROIDFLOKI",
  "ASTEROIDOGE",
  "ASTHERUS",
  "ASTO",
  "ASTR",
  "ASTRA",
  "ASTRO",
  "ASTROBOY",
  "ASTS",
  "ASTSON",
  "ASTSX",
  "ASUSDF",
  "ASV",
  "AT",
  "ATA",
  "ATB",
  "ATC",
  "ATD",
  "ATH",
  "ATHX",
  "ATKRON",
  "ATL",
  "ATLA",
  "ATLAS",
  "ATM",
  "ATOM",
  "ATONE",
  "ATOS",
  "ATR",
  "ATS",
  "ATT",
  "ATTN",
  "ATTRA",
  "ATWO",
  "AU79",
  "AUC",
  "AUCTION",
  "AUD",
  "AUDD",
  "AUDIO",
  "AUDM",
  "AUDX",
  "AUG",
  "AUKI",
  "AUR",
  "AURA",
  "AURON",
  "AURORA",
  "AURY",
  "AUSD",
  "AUSDT",
  "AUTISM",
  "AUTO",
  "AUTOS",
  "AUTUMN",
  "AV",
  "AVA",
  "AVAAI",
  "AVAI",
  "AVAIL",
  "AVAX",
  "AVAXAI",
  "AVB",
  "AVC",
  "AVDO",
  "AVG",
  "AVGO",
  "AVGOB",
  "AVGOON",
  "AVGOX",
  "AVICI",
  "AVIVE",
  "AVL",
  "AVLT",
  "AVM",
  "AVN",
  "AVNT",
  "AVRK",
  "AVT",
  "AVV",
  "AWARE",
  "AWC",
  "AWE",
  "AWR",
  "AXCNH",
  "AXE",
  "AXGT",
  "AXIOM",
  "AXL",
  "AXLUSDC",
  "AXM",
  "AXOL",
  "AXOME",
  "AXPON",
  "AXR",
  "AXS",
  "AXS3L",
  "AXS3S",
  "AXT",
  "AXTI",
  "AXTIB",
  "AXTION",
  "AYNI",
  "AZ",
  "AZERO",
  "AZIT",
  "AZNX",
  "AZTEC",
  "AZUKI",
  "AZUR",
  "AZY",
  "B",
  "B2",
  "B20",
  "B2M",
  "B3",
  "B3TR",
  "B3X",
  "B4",
  "BA",
  "BAAS",
  "BABA",
  "BABAB",
  "BABAON",
  "BABI",
  "BABY",
  "BABY4",
  "BABYASTER",
  "BABYASTEROID",
  "BABYBNB",
  "BABYBOME",
  "BABYBONK",
  "BABYBTC",
  "BABYCAT",
  "BABYCATE",
  "BABYCREPE",
  "BABYDOGE",
  "BABYDRAGON",
  "BABYETH",
  "BABYFLOKI",
  "BABYFWOG",
  "BABYGROK",
  "BABYHANC",
  "BABYHIPPO",
  "BABYLONG",
  "BABYNEIRO",
  "BABYPEIPEI",
  "BABYPEPE",
  "BABYPNUT",
  "BABYPOPCAT",
  "BABYSHARK",
  "BABYSHIB",
  "BABYSOL",
  "BABYTROLL",
  "BABYTRUMP",
  "BABYU",
  "BABYWLFI",
  "BABYXRP",
  "BAC",
  "BACHI",
  "BACON",
  "BACX",
  "BAD",
  "BADGER",
  "BAG",
  "BAI",
  "BAION",
  "BAKE",
  "BAKED",
  "BAKEDOWN",
  "BAKEUP",
  "BAL",
  "BALA",
  "BALD",
  "BALL",
  "BALT",
  "BALTO",
  "BAMBOO",
  "BAN",
  "BANANA",
  "BANANAGUY",
  "BANANAS31",
  "BAND",
  "BANK",
  "BANUS",
  "BANX",
  "BAO",
  "BAON",
  "BAR",
  "BARA",
  "BARD",
  "BARRON",
  "BARSIK",
  "BAS",
  "BASE",
  "BASED",
  "BASED1",
  "BASEDAI",
  "BAT",
  "BAX",
  "BAY",
  "BAZED",
  "BB",
  "BBA",
  "BBAION",
  "BBBTC",
  "BBC",
  "BBD",
  "BBFT",
  "BBOB",
  "BBS",
  "BBSNEK",
  "BBSOL",
  "BBT",
  "BBTC",
  "BBTF",
  "BC",
  "BC2",
  "BC400",
  "BCA",
  "BCAK",
  "BCAT",
  "BCCOIN",
  "BCD",
  "BCE",
  "BCH",
  "BCHB",
  "BCHSV",
  "BCN",
  "BCNA",
  "BCNT",
  "BCOIN",
  "BCOQ",
  "BCT",
  "BCUG",
  "BCUT",
  "BCZERO",
  "BDAG",
  "BDCA",
  "BDG",
  "BDOGITO",
  "BDP",
  "BDT",
  "BDTC",
  "BDX",
  "BDXN",
  "BE",
  "BEAM",
  "BEAR",
  "BEAST",
  "BEAT",
  "BEATS",
  "BEB",
  "BEB1M",
  "BEBE",
  "BEE",
  "BEEF",
  "BEENZ",
  "BEER",
  "BEER2",
  "BEETS",
  "BEFE",
  "BEFI",
  "BEL",
  "BELG",
  "BELKA",
  "BELLS",
  "BELT",
  "BENDOG",
  "BENI",
  "BENJI",
  "BENT",
  "BENTO",
  "BEON",
  "BEPE",
  "BERA",
  "BERN",
  "BERRY",
  "BERT",
  "BEST",
  "BET",
  "BETA",
  "BETH",
  "BEZOGE",
  "BF",
  "BFC",
  "BFG",
  "BFHT",
  "BFIC",
  "BFICGOLD",
  "BFT",
  "BFUSD",
  "BGA",
  "BGB",
  "BGBTC",
  "BGCI",
  "BGL",
  "BGSC",
  "BGSOL",
  "BGVT",
  "BHC",
  "BIAO",
  "BIB",
  "BIBI",
  "BICO",
  "BICS",
  "BID",
  "BIDUON",
  "BIDZ",
  "BIF",
  "BIFI",
  "BIG",
  "BIGGIE",
  "BIGOD",
  "BIGSB",
  "BIGTIME",
  "BIGTROUT",
  "BIGW",
  "BILION",
  "BILL",
  "BILLY",
  "BIM",
  "BINANCEAI",
  "BINANCEAIPRO",
  "BINANCEDOG",
  "BINANCIENS",
  "BINCON",
  "BINI",
  "BINK",
  "BIO",
  "BIOFI",
  "BIOK",
  "BIOT",
  "BIRB",
  "BIRD",
  "BIRDDOG",
  "BIT",
  "BITB",
  "BITCH",
  "BITCI",
  "BITCOIN",
  "BITO",
  "BITS",
  "BITTY",
  "BIZZ",
  "BJC",
  "BKN",
  "BKOK",
  "BKS",
  "BL",
  "BLACK",
  "BLACKBEAR",
  "BLACKDRAGON",
  "BLACKWHALE",
  "BLAST",
  "BLAZE",
  "BLAZR",
  "BLC",
  "BLD",
  "BLEND",
  "BLENDR",
  "BLESS",
  "BLF",
  "BLIFFY",
  "BLINK",
  "BLK",
  "BLKON",
  "BLM",
  "BLOB",
  "BLOCK",
  "BLOCKS",
  "BLOCKST",
  "BLOK",
  "BLOXWAP",
  "BLS",
  "BLSHON",
  "BLU",
  "BLUAI",
  "BLUB",
  "BLUE",
  "BLUESPARROW",
  "BLUEY",
  "BLUM",
  "BLUR",
  "BLUR2L",
  "BLUR2S",
  "BLY",
  "BLZ",
  "BMAX",
  "BMB",
  "BMEX",
  "BMI",
  "BMNR",
  "BMNRON",
  "BMNRX",
  "BMON",
  "BMT",
  "BMX",
  "BNB",
  "BNB CARD",
  "BNBBONK",
  "BNBBUNNY",
  "BNBCAKE",
  "BNBCAT",
  "BNBDOG",
  "BNBDOGE",
  "BNBFLOKI",
  "BNBHOLDER",
  "BNBLION",
  "BNBOLYMPIC",
  "BNBSNAKE",
  "BNBTC",
  "BNBTIGER",
  "BNBUSD",
  "BNBVEGETA",
  "BNBX",
  "BNBXBT",
  "BNC",
  "BNKR",
  "BNKRS",
  "BNOON",
  "BNRENSHENG",
  "BNS",
  "BNSD",
  "BNSOL",
  "BNT",
  "BNTY",
  "BNX",
  "BOATKID",
  "BOB",
  "BOBA",
  "BOBAOPPA",
  "BOBBOB",
  "BOBE",
  "BOBER",
  "BOBO",
  "BODA",
  "BODAV2",
  "BODEN",
  "BOE",
  "BOG",
  "BOGGY",
  "BOI",
  "BOLD",
  "BOLT",
  "BOMB",
  "BOME",
  "BOMET",
  "BOMI",
  "BOMO",
  "BOND",
  "BONDLY",
  "BONDX",
  "BONE",
  "BONFIRE",
  "BONK",
  "BONK2.0",
  "BONKEY",
  "BOOB",
  "BOOCHIE",
  "BOOE",
  "BOOGIE",
  "BOOK",
  "BOOM",
  "BOOMER",
  "BOOP",
  "BOOPA",
  "BOOST",
  "BOOT",
  "BOP",
  "BOPPY",
  "BORA",
  "BORED",
  "BORG",
  "BORGY",
  "BORING",
  "BORK",
  "BOS",
  "BOSHI",
  "BOSON",
  "BOSS",
  "BOT",
  "BOTIFY",
  "BOTON",
  "BOTTO",
  "BOTX",
  "BOTZ",
  "BOTZON",
  "BOUNTY",
  "BOUTS",
  "BOW",
  "BOX",
  "BOXABL",
  "BOYS",
  "BOYSCLUB",
  "BOZO",
  "BP",
  "BPEPE",
  "BPL",
  "BPT",
  "BPX",
  "BPXL",
  "BR",
  "BRAIN",
  "BRAINLET",
  "BREAD",
  "BRENT",
  "BRETT",
  "BRETT2.0",
  "BRETTA",
  "BREV",
  "BREW",
  "BRG",
  "BRIAN",
  "BRIC",
  "BRICS",
  "BRIL",
  "BRISE",
  "BRIUN",
  "BRK.BX",
  "BRKB",
  "BRKL",
  "BRL",
  "BRL1",
  "BRLNON",
  "BRM",
  "BRN",
  "BRO",
  "BROAK",
  "BROCCOLI",
  "BROKE",
  "BROWN",
  "BRP",
  "BRUSH",
  "BRWL",
  "BRYAN",
  "BRZ",
  "BSAI",
  "BSB",
  "BSC",
  "BSCPAD",
  "BSCS",
  "BSHIB",
  "BSK-BAA025",
  "BSL",
  "BSOL",
  "BSOP",
  "BSP",
  "BSR",
  "BSSB",
  "BST",
  "BSTC",
  "BSTY",
  "BSV",
  "BSW",
  "BSWAP",
  "BSX",
  "BTA",
  "BTAF",
  "BTB",
  "BTBS",
  "BTBTX",
  "BTC",
  "BTC.B",
  "BTC.\u210F",
  "BTC2",
  "BTC2.0",
  "BTC2X-FLI",
  "BTCACT",
  "BTCAT",
  "BTCB",
  "BTCBAM",
  "BTCBULL",
  "BTCDOM",
  "BTCDRAGON",
  "BTCF",
  "BTCINU",
  "BTCLE",
  "BTCMT",
  "BTCP",
  "BTCPAY",
  "BTCR",
  "BTCST",
  "BTCT",
  "BTCZ",
  "BTDRON",
  "BTE",
  "BTG",
  "BTGON",
  "BTGOX",
  "BTH",
  "BTL",
  "BTMETA",
  "BTMT",
  "BTNTV2",
  "BTR",
  "BTRS",
  "BTRST",
  "BTRUMP",
  "BTS",
  "BTSE",
  "BTSG",
  "BTT",
  "BTTOLD",
  "BTTY",
  "BTW",
  "BTX",
  "BTY",
  "BUB",
  "BUBB",
  "BUBBA",
  "BUBBLE",
  "BUBI",
  "BUBO",
  "BUCK",
  "BUCKAZOIDS",
  "BUCKY",
  "BUD",
  "BUDDY",
  "BUILD",
  "BUILDOUT",
  "BUL",
  "BULL",
  "BULLA",
  "BULLISH",
  "BULLY",
  "BULT",
  "BUNKER",
  "BUNNY",
  "BURGER",
  "BURN",
  "BUSD",
  "BUSD0",
  "BUSY",
  "BUT",
  "BUTTCOIN",
  "BUTTPLUG",
  "BUU",
  "BUY",
  "BUZ",
  "BUZZ",
  "BV7X",
  "BWB",
  "BWETON",
  "BX",
  "BXC",
  "BXE",
  "BXN",
  "BXX",
  "BYAT",
  "BYB",
  "BYN",
  "BYTE",
  "BYTES",
  "BZ",
  "BZE",
  "BZIL",
  "BZON",
  "BZR",
  "BZZ",
  "C",
  "C1USD",
  "C2",
  "C20",
  "C4E",
  "C98",
  "CA",
  "CAB",
  "CAD",
  "CADC",
  "CADH",
  "CADINU",
  "CAGA",
  "CAH",
  "CAI",
  "CAJ",
  "CAKE",
  "CAL",
  "CALLS",
  "CAMLY",
  "CAMP",
  "CAN",
  "CANCER",
  "CANDY",
  "CANDYLAD",
  "CANN",
  "CAP",
  "CAPINFRA",
  "CAPRICORN",
  "CAPRON",
  "CAPS",
  "CAPTAINBNB",
  "CAPX",
  "CAPY",
  "CAR",
  "CARAT",
  "CARBON",
  "CARDS",
  "CARLO",
  "CARMIN",
  "CARR",
  "CARROT",
  "CARTIER",
  "CARV",
  "CAS",
  "CASH",
  "CASH+",
  "CASHCAT",
  "CASINU",
  "CAST",
  "CAT",
  "CATA",
  "CATANA",
  "CATCOIN",
  "CATDOG",
  "CATE",
  "CATG",
  "CATGIRL",
  "CATGPT",
  "CATHEON",
  "CATI",
  "CATME",
  "CATO",
  "CATON",
  "CATS",
  "CATTON",
  "CATWIF",
  "CATX",
  "CATZILLA",
  "CAUSE",
  "CAW",
  "CB",
  "CBADA",
  "CBBTC",
  "CBDOGE",
  "CBETH",
  "CBG",
  "CBK",
  "CBLTC",
  "CBMEGA",
  "CBNB",
  "CBP",
  "CBPAY",
  "CBRS",
  "CBRSB",
  "CBRSON",
  "CBTC",
  "CBX",
  "CBXRP",
  "CC",
  "CCA",
  "CCASH",
  "CCC",
  "CCD",
  "CCDOG",
  "CCJON",
  "CCO2",
  "CCV2",
  "CDAI",
  "CDCETH",
  "CDL",
  "CDOGE",
  "CDR",
  "CDT",
  "CDX",
  "CDXR",
  "CEEK",
  "CEGON",
  "CEICAT",
  "CEL",
  "CELL",
  "CELO",
  "CELR",
  "CENT",
  "CENX",
  "CERE",
  "CERTAI",
  "CES",
  "CESS",
  "CET",
  "CETES",
  "CETUS",
  "CEUR",
  "CF",
  "CFG",
  "CFI",
  "CFX",
  "CFX2L",
  "CFX2S",
  "CGG",
  "CGLD",
  "CGN",
  "CGO",
  "CGPT",
  "CGX",
  "CHAD",
  "CHADETTE",
  "CHAIN",
  "CHAINCADE",
  "CHAMP",
  "CHANEL",
  "CHAPZ",
  "CHARGED",
  "CHAT",
  "CHATOSHI",
  "CHATTY",
  "CHECK",
  "CHEEL",
  "CHEEMS",
  "CHEEPEPE",
  "CHEERS",
  "CHEESE",
  "CHEQ",
  "CHESS",
  "CHEX",
  "CHEYENNE",
  "CHF",
  "CHI",
  "CHIB",
  "CHILI",
  "CHILLGUY",
  "CHILLHOUSE",
  "CHIN",
  "CHINAU",
  "CHINU",
  "CHIP",
  "CHIPPY",
  "CHIRP",
  "CHKN",
  "CHLI",
  "CHMB",
  "CHMPZ",
  "CHO",
  "CHOMP",
  "CHONKETHA",
  "CHONKY",
  "CHR",
  "CHRETT",
  "CHRP",
  "CHT",
  "CHUANPU",
  "CHUCK",
  "CHWY",
  "CHZ",
  "CIBRON",
  "CIEN",
  "CIENON",
  "CIF",
  "CIFRON",
  "CIK",
  "CINO",
  "CIRCLE",
  "CITY",
  "CJ",
  "CJL",
  "CJPY",
  "CKB",
  "CKBTC",
  "CKC",
  "CKETH",
  "CKP",
  "CL",
  "CLAM",
  "CLANKER",
  "CLASH",
  "CLASS",
  "CLAWD",
  "CLAWNCH",
  "CLEAR",
  "CLEG",
  "CLIFFORD",
  "CLIPPY",
  "CLIPS",
  "CLIPX",
  "CLND",
  "CLNX",
  "CLO",
  "CLOAK",
  "CLOAON",
  "CLOION",
  "CLOKI",
  "CLONE",
  "CLOOTS",
  "CLORE",
  "CLOUD",
  "CLS",
  "CLSON",
  "CLT",
  "CLUB",
  "CLV",
  "CLY",
  "CMC20",
  "CMCSAX",
  "CMDX",
  "CMETH",
  "CMFI",
  "CMGON",
  "CMR",
  "CMT",
  "CNB",
  "CNC",
  "CNF",
  "CNG",
  "CNGN",
  "CNHT",
  "CNKT+",
  "CNR",
  "CNS",
  "CNT",
  "CNTR",
  "CNX",
  "CO",
  "COAI",
  "COBY",
  "COCA",
  "COCO",
  "COCORO",
  "CODEX",
  "COFON",
  "COGE",
  "COGI",
  "COHR",
  "COHRON",
  "COIN",
  "COINB",
  "COINBANK",
  "COINDEPO",
  "COINON",
  "COINS",
  "COINX",
  "COINYE",
  "COK",
  "COL",
  "COLLAT",
  "COLLE",
  "COLLECT",
  "COLS",
  "COLX",
  "COM",
  "COMBO",
  "COMMON",
  "COMP",
  "COMPDOWN",
  "COMPUP",
  "CON",
  "CONAN",
  "CONCHO",
  "CONCILIUM",
  "CONE",
  "CONVO",
  "CONX",
  "COOK",
  "COOKIE",
  "COOL",
  "COP",
  "COPE",
  "COPON",
  "COPPER",
  "COPXON",
  "COPXX",
  "COPYCAT",
  "COQ",
  "COQAI",
  "COR",
  "CORAL",
  "CORE",
  "CORECHAIN",
  "COREUM",
  "CORGI",
  "CORGIAI",
  "CORGIB",
  "CORL",
  "CORN",
  "CORX",
  "CORZON",
  "COS",
  "COSA",
  "COSMO",
  "COSMOSDYDX",
  "COST",
  "COSTON",
  "COT",
  "COTI",
  "COVAL",
  "COW",
  "CPC",
  "CPERON",
  "CPFC",
  "CPH",
  "CPL",
  "CPM",
  "CPNGON",
  "CPOO",
  "CPOOL",
  "CPR",
  "CPS",
  "CPT",
  "CPX",
  "CRADLE",
  "CRASH",
  "CRAT",
  "CRAZY",
  "CRAZYBONK",
  "CRAZYBUNNY",
  "CRAZYCAT",
  "CRAZYDOGE",
  "CRAZYDRAGON",
  "CRAZYMUSK",
  "CRAZYPEPE",
  "CRBRUS",
  "CRCL",
  "CRCLB",
  "CRCLON",
  "CRCLX",
  "CRDO",
  "CRDOON",
  "CRDT",
  "CREAL",
  "CREAM",
  "CREDI",
  "CREO",
  "CREPE",
  "CRETA",
  "CREVA",
  "CRF",
  "CRISPR",
  "CRM",
  "CRMON",
  "CRMS",
  "CRMX",
  "CRO",
  "CROAK",
  "CROB",
  "CRODIE",
  "CROGE",
  "CROID",
  "CRONA",
  "CROSS",
  "CROWN",
  "CRP",
  "CRPT",
  "CRT",
  "CRTAI",
  "CRTR",
  "CRTS",
  "CRU",
  "CRV",
  "CRVFRAX",
  "CRVUSD",
  "CRW",
  "CRWD",
  "CRWDON",
  "CRWDX",
  "CRWNY",
  "CRWV",
  "CRWVB",
  "CRWVON",
  "CRYBB",
  "CRYN",
  "CRYO",
  "CRYPGPT",
  "CRYPTO",
  "CRYPTON",
  "CRYSTAL STONES",
  "CRYSTL",
  "CSC",
  "CSCO",
  "CSCOON",
  "CSCOX",
  "CSI",
  "CSIX",
  "CSPR",
  "CSR",
  "CST",
  "CSW",
  "CSWAP",
  "CTA",
  "CTB",
  "CTC",
  "CTG",
  "CTH",
  "CTK",
  "CTM",
  "CTO",
  "CTP",
  "CTR",
  "CTSI",
  "CTSIDOWN",
  "CTSIUP",
  "CTX",
  "CTYN",
  "CUB",
  "CUBE",
  "CUDIS",
  "CULT",
  "CUMMIES",
  "CUSD",
  "CUSDO",
  "CVAI",
  "CVC",
  "CVNAON",
  "CVP",
  "CVT",
  "CVX",
  "CVXCRV",
  "CVXFXS",
  "CVXON",
  "CVXX",
  "CWAR",
  "CWEB",
  "CWIF",
  "CWOIN",
  "CWS",
  "CWT",
  "CWU",
  "CX",
  "CXMT",
  "CXO",
  "CXT",
  "CYBER",
  "CYBRO",
  "CYC",
  "CYCE",
  "CYPR",
  "CYS",
  "CYT",
  "CZAI",
  "CZF",
  "CZGOAT",
  "CZUSD",
  "CZW",
  "D",
  "D.O.G.E",
  "D223",
  "D2T",
  "DACAT",
  "DAD",
  "DADA",
  "DADDY",
  "DADDYDOGE",
  "DAG",
  "DAGS",
  "DAI",
  "DAISY",
  "DAM",
  "DAN",
  "DANKDOGE",
  "DANKDOGEAI",
  "DANNY",
  "DAO",
  "DAOP",
  "DAOSOL",
  "DAPP",
  "DAR",
  "DARA",
  "DARAM",
  "DARIK",
  "DARK",
  "DARKSTAR",
  "DASH",
  "DASHON",
  "DATA",
  "DATBOI",
  "DAVINCI",
  "DAW",
  "DAWG",
  "DBC",
  "DBCON",
  "DBD",
  "DBI",
  "DBR",
  "DBX",
  "DC",
  "DCAU",
  "DCB",
  "DCD",
  "DCI",
  "DCK",
  "DCR",
  "DCT",
  "DD",
  "DDBAM",
  "DDM",
  "DDX",
  "DEAI",
  "DEBT",
  "DEC",
  "DECHAT",
  "DEEBO",
  "DEEP",
  "DEEPAI",
  "DEEPSEEK",
  "DEEPSEEKAI",
  "DEFAI",
  "DEFI",
  "DEFX",
  "DEGE",
  "DEGEN",
  "DEGENAI",
  "DEGO",
  "DEGOD",
  "DEL",
  "DELABS",
  "DELL",
  "DELLB",
  "DELLON",
  "DELLX",
  "DEM",
  "DENT",
  "DEOD",
  "DEON",
  "DEP",
  "DEPINS",
  "DEPLOYR",
  "DERO",
  "DESCIAI",
  "DESO",
  "DESU",
  "DEURO",
  "DEUS",
  "DEVVE",
  "DEW",
  "DEXE",
  "DEXNET",
  "DEXO",
  "DEXT",
  "DEXTF",
  "DF",
  "DFC",
  "DFDVX",
  "DFG",
  "DFH",
  "DFI",
  "DFIAT",
  "DFL",
  "DFT",
  "DFYN",
  "DG",
  "DGB",
  "DGC",
  "DGLD",
  "DGLN",
  "DGMA",
  "DGN",
  "DGRAM",
  "DGRWON",
  "DGTA",
  "DGXXON",
  "DHF",
  "DHN",
  "DHRX",
  "DHT",
  "DHV",
  "DIA",
  "DIAM",
  "DIAMOND",
  "DICKBUTT",
  "DIDID",
  "DIEM",
  "DIFX",
  "DIGAU",
  "DIGI",
  "DIGIMON",
  "DIME",
  "DIMO",
  "DIN",
  "DINAR",
  "DINGER",
  "DINGO",
  "DINO",
  "DINU",
  "DIO",
  "DIONE",
  "DIP",
  "DIS",
  "DISON",
  "DITAU",
  "DITH",
  "DIVI",
  "DJED",
  "DJI6930",
  "DJT",
  "DKA",
  "DKEY",
  "DKNG",
  "DL",
  "DLB",
  "DLC",
  "DLLR",
  "DLORD",
  "DLT",
  "DLYCOP",
  "DM",
  "DMAGA",
  "DMC",
  "DMCC",
  "DMCP",
  "DMD",
  "DMT",
  "DMT-NAT",
  "DMTR",
  "DN",
  "DNA",
  "DNNON",
  "DNOW",
  "DNT",
  "DNX",
  "DOBO",
  "DOC",
  "DODO",
  "DOE",
  "DOFI",
  "DOG",
  "DOGAI",
  "DOGE",
  "DOGE-1",
  "DOGE2.0",
  "DOGE20",
  "DOGEAI",
  "DOGEBASE",
  "DOGEC",
  "DOGECAUCUS",
  "DOGECOIN",
  "DOGECUBE",
  "DOGEFATHER",
  "DOGEGF",
  "DOGEKING",
  "DOGEMARS",
  "DOGEN",
  "DOGER",
  "DOGEUS",
  "DOGEVERSE",
  "DOGEX",
  "DOGGO",
  "DOGGY",
  "DOGI",
  "DOGIMUS",
  "DOGINME",
  "DOGO",
  "DOGPU",
  "DOGS",
  "DOGWIFHAT",
  "DOKY",
  "DOLA",
  "DOLAN",
  "DOLLAR",
  "DOLO",
  "DOLR",
  "DOLZ",
  "DOM",
  "DOME",
  "DOMI",
  "DON",
  "DONALD",
  "DONKEY",
  "DONS",
  "DONT",
  "DOOD",
  "DOODI",
  "DOODOO",
  "DOOGLE",
  "DOOMER",
  "DOP",
  "DOP2",
  "DOPAMINE",
  "DOPU",
  "DORA",
  "DORKY",
  "DOS",
  "DOT",
  "DOVU",
  "DOYR",
  "DPI",
  "DPINO",
  "DPLN",
  "DPN",
  "DPR",
  "DRAGGY",
  "DRAGON",
  "DRAGONX",
  "DRAM",
  "DRAMB",
  "DRAMON",
  "DRB",
  "DRC",
  "DRDR",
  "DREAMS",
  "DREP",
  "DRESS",
  "DRG",
  "DRGN",
  "DRIFT",
  "DRIP",
  "DRM",
  "DROP",
  "DRPXBT",
  "DRT",
  "DRV",
  "DRX",
  "DSC",
  "DSFR",
  "DSG",
  "DSHIB",
  "DSLA",
  "DSYNC",
  "DTBX",
  "DTCRON",
  "DTEC",
  "DTG",
  "DTRC",
  "DTV",
  "DUAL",
  "DUCK",
  "DUCKAI",
  "DUCKIES",
  "DUCKY",
  "DUCX",
  "DUEL",
  "DUET",
  "DUKO",
  "DUPE",
  "DUREV",
  "DUSD",
  "DUSK",
  "DUST",
  "DUSTY",
  "DVI",
  "DVK",
  "DXCT",
  "DXD",
  "DXGM",
  "DXI",
  "DXLC",
  "DXN",
  "DYDX",
  "DYDXDOWN",
  "DYDXUP",
  "DYM",
  "DYNA",
  "DYOR",
  "DYP",
  "E",
  "EAFIN",
  "EAGLE",
  "EAI",
  "EARL",
  "EARN",
  "EARNM",
  "EAT",
  "EBA",
  "EBAY",
  "EBSO",
  "EBTC",
  "EBULL",
  "EBYT",
  "ECC",
  "ECHO",
  "ECHON",
  "ECOIN",
  "ECOON",
  "ECOR",
  "ECOREAL",
  "ECTE",
  "EDE",
  "EDEL",
  "EDEN",
  "EDENA",
  "EDGE",
  "EDGEAI",
  "EDGEN",
  "EDGESOL",
  "EDGEX",
  "EDOM",
  "EDRC",
  "EDU",
  "EDUM",
  "EDWIN",
  "EDX",
  "EEMON",
  "EETH",
  "EEUR",
  "EFAON",
  "EFC",
  "EFFECT",
  "EFFORT",
  "EFI",
  "EFL",
  "EFT",
  "EFUN",
  "EFX",
  "EGAME",
  "EGG",
  "EGGT",
  "EGL1",
  "EGLD",
  "EGO",
  "EGP",
  "EGX",
  "EICOIN",
  "EIFI",
  "EIGEN",
  "EITHER",
  "EJS",
  "EKTA",
  "EKUBO",
  "EL",
  "ELA",
  "ELAND",
  "ELCASH",
  "ELDE",
  "ELECTRON",
  "ELEPHANT",
  "ELET",
  "ELEVATE",
  "ELF",
  "ELG",
  "ELGATO",
  "ELIEN",
  "ELITEHERO",
  "ELIX",
  "ELIZA",
  "ELIZABETH",
  "ELIZAOK",
  "ELIZAOS",
  "ELK",
  "ELMO",
  "ELMON",
  "ELMT",
  "ELON",
  "ELON4AFD",
  "ELONCOIN",
  "ELP",
  "ELS",
  "ELSA",
  "ELX",
  "ELXAI",
  "EMAX",
  "EMBLEM",
  "EMC",
  "EMDR",
  "EMP",
  "EMPI",
  "EMR",
  "EMRON",
  "EMT",
  "EMYC",
  "ENA",
  "ENBON",
  "END",
  "ENF",
  "ENJ",
  "ENLVON",
  "ENPHON",
  "ENQAI",
  "ENS",
  "ENSO",
  "ENT",
  "ENTGON",
  "ENTROPY",
  "ENTS",
  "ENX",
  "EOS",
  "EOS3L",
  "EOS3S",
  "EOSDAC",
  "EPIC",
  "EPIK",
  "EPS",
  "EPT",
  "EPWX",
  "EPX",
  "EQ",
  "EQ9",
  "EQB",
  "EQIXON",
  "EQPAY",
  "EQTY",
  "ERA",
  "ERBB",
  "ERG",
  "ERIC",
  "ERN",
  "ERSDL",
  "ERTHA",
  "ERW",
  "ES",
  "ESD",
  "ESE",
  "ESHIB",
  "ESIM",
  "ESP",
  "ESPORTS",
  "ESTEE",
  "ESX",
  "ET",
  "ETAN",
  "ETC",
  "ETCDOWN",
  "ETCUP",
  "ETERNAL",
  "ETF",
  "ETF500",
  "ETH",
  "ETH2",
  "ETH2X-FLI",
  "ETHAON",
  "ETHB",
  "ETHDYDX",
  "ETHEREUM",
  "ETHF",
  "ETHFI",
  "ETHI",
  "ETHIX",
  "ETHW",
  "ETHX",
  "ETI",
  "ETN",
  "ETNA",
  "ETNON",
  "ETNX",
  "ETPOS",
  "EUC",
  "EUL",
  "EUR",
  "EURA",
  "EURAU",
  "EURC",
  "EURCV",
  "EURE",
  "EURI",
  "EUROE",
  "EUROP",
  "EURQ",
  "EURR",
  "EURS",
  "EURT",
  "EUR\u0421",
  "EUSD",
  "EUSX",
  "EV",
  "EVA",
  "EVAA",
  "EVAL",
  "EVAN",
  "EVDC",
  "EVER",
  "EVERETH",
  "EVIL",
  "EVMOS",
  "EVO",
  "EVR",
  "EVY",
  "EWJ",
  "EWJON",
  "EWT",
  "EWY",
  "EWYB",
  "EWYON",
  "EWYX",
  "EWZ",
  "EWZON",
  "EXA",
  "EXCC",
  "EXE",
  "EXO",
  "EXODON",
  "EXPERT",
  "EXRD",
  "EXTRA",
  "EXTRON",
  "EYE",
  "EYWA",
  "EZETH",
  "EZSOL",
  "F",
  "FAC",
  "FACEDAO",
  "FACT",
  "FACY",
  "FAFO",
  "FAH",
  "FAI",
  "FAIR3",
  "FAKEAI",
  "FAKT",
  "FAM",
  "FAME",
  "FANC",
  "FANTC",
  "FANX",
  "FAR",
  "FARM",
  "FARTBOY",
  "FARTCOIN",
  "FARTLESS",
  "FAT",
  "FB",
  "FBTC",
  "FBX",
  "FCELON",
  "FCK925",
  "FCO",
  "FCON",
  "FCP",
  "FCT",
  "FCTR",
  "FCXON",
  "FDC",
  "FDGC",
  "FDM",
  "FDS",
  "FDUSD",
  "FEARNOT",
  "FECES",
  "FEFE",
  "FEG",
  "FEI",
  "FELIS",
  "FELY",
  "FER",
  "FERMA",
  "FET",
  "FETDOWN",
  "FETUP",
  "FF",
  "FFOGON",
  "FGD",
  "FGDLON",
  "FHE",
  "FID",
  "FIDA",
  "FIDD",
  "FIFA",
  "FIG",
  "FIGHT",
  "FIGON",
  "FIGRON",
  "FIGR_HELOC",
  "FIL",
  "FILDOWN",
  "FILUP",
  "FINA",
  "FINC",
  "FINE",
  "FIO",
  "FIR",
  "FIRE",
  "FIRO",
  "FIS",
  "FISH",
  "FISHW",
  "FIST",
  "FITFI",
  "FIWA",
  "FKH",
  "FLAG",
  "FLAPPY",
  "FLAVIA",
  "FLAY",
  "FLDT",
  "FLETH",
  "FLEX",
  "FLEXON",
  "FLHYON",
  "FLIGHT",
  "FLIP",
  "FLIX",
  "FLIXX",
  "FLK",
  "FLM",
  "FLNC",
  "FLNCB",
  "FLNCON",
  "FLOCK",
  "FLOCKA",
  "FLOKI",
  "FLOKICASH",
  "FLOKICEO",
  "FLOKIDOWN",
  "FLOKITA",
  "FLOKIUP",
  "FLOKIX",
  "FLORK",
  "FLOT",
  "FLOW",
  "FLOWER",
  "FLQLON",
  "FLR",
  "FLRBRG",
  "FLT",
  "FLU",
  "FLUF",
  "FLUFFI",
  "FLUID",
  "FLURRY",
  "FLUX",
  "FLX",
  "FLY",
  "FM",
  "FNA",
  "FNCT",
  "FNON",
  "FNXAI",
  "FOC",
  "FODL",
  "FOFAR",
  "FOG",
  "FOGO",
  "FOLKS",
  "FOMO",
  "FON",
  "FONQ",
  "FOOM",
  "FOR",
  "FOREST",
  "FOREX",
  "FORKY",
  "FORM",
  "FORMON",
  "FORT",
  "FORTH",
  "FORU",
  "FOUNDER",
  "FOUR",
  "FOX",
  "FOXSY",
  "FOXY",
  "FPI",
  "FPIBANK",
  "FPIS",
  "FPS",
  "FRAG",
  "FRAX",
  "FRC",
  "FRED",
  "FREE",
  "FREED",
  "FREEDOMOFMONEY",
  "FREN",
  "FRGX",
  "FRIC",
  "FRIEND",
  "FRM",
  "FRN",
  "FROC",
  "FROG",
  "FROGE",
  "FROGGIE",
  "FRONK",
  "FRONT",
  "FROX",
  "FRP",
  "FRST",
  "FRT",
  "FRTC",
  "FRTS",
  "FRXETH",
  "FRXUSD",
  "FRY",
  "FSCC",
  "FSOLON",
  "FST",
  "FT",
  "FTC",
  "FTD",
  "FTGCON",
  "FTM3S",
  "FTMX",
  "FTN",
  "FTR",
  "FTRB",
  "FTT",
  "FTW",
  "FTX",
  "FU",
  "FUD",
  "FUEL",
  "FUELX",
  "FUFU",
  "FUL",
  "FULA",
  "FUN",
  "FUN1",
  "FUNGI",
  "FURM",
  "FURY",
  "FUSAKA",
  "FUSD",
  "FUSDC",
  "FUSE",
  "FUTU",
  "FUTUON",
  "FWC",
  "FWD",
  "FWDI",
  "FWOG",
  "FWX",
  "FX",
  "FXC",
  "FXD",
  "FXI",
  "FXION",
  "FYN",
  "G",
  "G$",
  "G3",
  "GAFI",
  "GAGA",
  "GAI",
  "GAIA",
  "GAIB",
  "GAIN",
  "GAIX",
  "GAJ",
  "GAL",
  "GALA",
  "GALAX",
  "GALEON",
  "GALO",
  "GAMA",
  "GAME",
  "GAMEAI",
  "GAMES",
  "GARI",
  "GARY",
  "GAS",
  "GASS",
  "GAT",
  "GATA",
  "GATO",
  "GATSBY",
  "GAU",
  "GAYTES",
  "GB",
  "GBCK",
  "GBD",
  "GBE",
  "GBK",
  "GBNB",
  "GBP",
  "GBTC",
  "GBYTE",
  "GCAKE",
  "GCB",
  "GCC",
  "GCOIN",
  "GCOTI",
  "GCRM",
  "GD",
  "GDON",
  "GEAR",
  "GEC",
  "GECKO",
  "GEEQ",
  "GEKKO",
  "GEL",
  "GEMINI",
  "GEMION",
  "GEMS",
  "GEMSTON",
  "GENE",
  "GENI",
  "GENIE",
  "GENIUS",
  "GENOME",
  "GENZ",
  "GEOD",
  "GEON",
  "GERMANY",
  "GET",
  "GEV",
  "GEVON",
  "GEVX",
  "GF",
  "GFAL",
  "GFARM2",
  "GFI",
  "GFLY",
  "GFN",
  "GFT",
  "GG",
  "GGB",
  "GGBR",
  "GGEZ1",
  "GGG",
  "GGP",
  "GGT",
  "GHHS",
  "GHIBLI",
  "GHNY",
  "GHO",
  "GHOST",
  "GHST",
  "GHUB",
  "GHX",
  "GIB",
  "GICAT",
  "GIGA",
  "GIGACHAD",
  "GIGGLE",
  "GIGGLES",
  "GIGL",
  "GIKO",
  "GINNAN",
  "GINUX",
  "GINZA",
  "GIOVE",
  "GIV",
  "GIVE",
  "GIZA",
  "GLC",
  "GLD",
  "GLDON",
  "GLDT",
  "GLDX",
  "GLEEC",
  "GLGNS",
  "GLIDR",
  "GLINK",
  "GLM",
  "GLMR",
  "GLMRDOWN",
  "GLMRUP",
  "GLQ",
  "GLTRON",
  "GLUTEU",
  "GLW",
  "GLWB",
  "GLWON",
  "GLXYON",
  "GM",
  "GMAC",
  "GMCOIN",
  "GME",
  "GMEE",
  "GMEON",
  "GMEX",
  "GMFAM",
  "GMFI",
  "GMIX",
  "GMM",
  "GMMT",
  "GMON",
  "GMR",
  "GMRT",
  "GMRX",
  "GMT",
  "GMT3L",
  "GMT3S",
  "GMTO",
  "GMX",
  "GNC",
  "GNET",
  "GNFT",
  "GNK",
  "GNO",
  "GNOD",
  "GNON",
  "GNS",
  "GNT",
  "GNUS",
  "GO4",
  "GOAL",
  "GOAT",
  "GOATED",
  "GOATS",
  "GOBI",
  "GOC",
  "GOCHU",
  "GOD",
  "GODS",
  "GOF",
  "GOG",
  "GOGE",
  "GOGLZ",
  "GOHM",
  "GOHOME",
  "GOIDR",
  "GOKU",
  "GOLD",
  "GOLDAO",
  "GOLDEN",
  "GOLDGR",
  "GOME",
  "GOMINING",
  "GONDOLA",
  "GONE",
  "GOOGL",
  "GOOGLB",
  "GOOGLON",
  "GOOGLX",
  "GOONC",
  "GOONER",
  "GOR",
  "GORILLA",
  "GORK",
  "GORTH",
  "GOT",
  "GOT2",
  "GOU",
  "GOUT",
  "GOZ",
  "GP",
  "GPM",
  "GPRO",
  "GPS",
  "GPST",
  "GPT",
  "GPU",
  "GQ",
  "GRABON",
  "GRACY",
  "GRAI",
  "GRAIL",
  "GRAM",
  "GRAMS",
  "GRANDMA",
  "GRAPE",
  "GRASS",
  "GRAV",
  "GRAY",
  "GRD",
  "GREEN",
  "GRFT",
  "GRG",
  "GRIFFAIN",
  "GRIFT",
  "GRIMACE",
  "GRIN",
  "GRIPPY",
  "GRLC",
  "GRM",
  "GRND",
  "GROK",
  "GROK3AI",
  "GROKAI",
  "GROKGIRL",
  "GROKINU",
  "GROOVE",
  "GROVE",
  "GROW",
  "GROYPER",
  "GRS",
  "GRT",
  "GRT2L",
  "GRT2S",
  "GRV",
  "GRVT",
  "GS",
  "GSB",
  "GSON",
  "GSR",
  "GST",
  "GSTS",
  "GSWIFT",
  "GSX",
  "GT",
  "GTA",
  "GTA6",
  "GTAI",
  "GTAN",
  "GTAVI",
  "GTBTC",
  "GTC",
  "GTETH",
  "GUA",
  "GUAC",
  "GUARD",
  "GUDTEK",
  "GUI",
  "GULD",
  "GULF",
  "GUM",
  "GUMMY",
  "GUN",
  "GUSD",
  "GUZUTA",
  "GVC",
  "GVL",
  "GWEI",
  "GWT",
  "GXA",
  "GXE",
  "GYAT",
  "GYEN",
  "GYMNET",
  "GYOSHI",
  "GYRO",
  "GZONE",
  "H",
  "H1DR4",
  "H2O",
  "H4CK",
  "HABIBI",
  "HAC",
  "HACD",
  "HACHI",
  "HACHIKO",
  "HAEDAL",
  "HAHA",
  "HAI",
  "HAIR",
  "HAKKA",
  "HALLOWEEN",
  "HALO",
  "HAM",
  "HAMI",
  "HAMMY",
  "HAN",
  "HANA",
  "HANC",
  "HAND",
  "HANU",
  "HAPI",
  "HAPPY",
  "HARAMBE",
  "HARAMBEAI",
  "HARE",
  "HARIKO",
  "HAROLD",
  "HASH",
  "HASHAI",
  "HASUI",
  "HAT",
  "HATCHY",
  "HAUST",
  "HAVEN",
  "HAWK",
  "HAWKTUAH",
  "HAY",
  "HBADG",
  "HBAR",
  "HBARX",
  "HBB",
  "HBD",
  "HBN",
  "HBOT",
  "HBT",
  "HBTC",
  "HBULL",
  "HBX",
  "HCT",
  "HD",
  "HDN",
  "HDON",
  "HDRO",
  "HDX",
  "HEART",
  "HEDG",
  "HEDGE",
  "HEEHEE",
  "HEGE",
  "HEGIC",
  "HEHE",
  "HEI",
  "HELA",
  "HELLO",
  "HELMET",
  "HEMI",
  "HEMULE",
  "HENLO",
  "HERA",
  "HERMES",
  "HERO",
  "HEU",
  "HEX",
  "HEZ",
  "HFT",
  "HFUN",
  "HGEN",
  "HGET",
  "HGPT",
  "HGT",
  "HI",
  "HIBS",
  "HIFI",
  "HIGH",
  "HIGHER",
  "HIION",
  "HILO",
  "HIMS",
  "HIMSON",
  "HIMSX",
  "HIMXON",
  "HINT",
  "HIPPO",
  "HISS",
  "HIT",
  "HIVE",
  "HLN",
  "HLX",
  "HMND",
  "HMQ",
  "HMSTR",
  "HMT",
  "HNB",
  "HNO",
  "HNS",
  "HNST",
  "HNT",
  "HNY",
  "HOB",
  "HOBA",
  "HOBBES",
  "HOD",
  "HODI",
  "HODL",
  "HOGE",
  "HOICHI",
  "HOKK",
  "HOLD",
  "HOLO",
  "HOLY",
  "HOME",
  "HOMS",
  "HON",
  "HONEY",
  "HONK",
  "HONX",
  "HOOD",
  "HOODB",
  "HOODER",
  "HOODOG",
  "HOODON",
  "HOODRAT",
  "HOODX",
  "HOOK",
  "HOOLI",
  "HOOP",
  "HOPPY",
  "HOPR",
  "HORD",
  "HORSE",
  "HOSICO",
  "HOSKY",
  "HOT",
  "HOTCROSS",
  "HOTKEY",
  "HOUSE",
  "HOW",
  "HP",
  "HPE",
  "HPEON",
  "HPL",
  "HPO",
  "HPOS10I",
  "HPP",
  "HPY",
  "HQ",
  "HRT",
  "HSAI",
  "HSAION",
  "HSK",
  "HSUITE",
  "HT",
  "HTD",
  "HTM",
  "HTO",
  "HTR",
  "HTS",
  "HTX",
  "HTZ",
  "HUAHUA",
  "HUB",
  "HUBBON",
  "HUMA",
  "HUND",
  "HUNDRED",
  "HUNNY",
  "HUNT",
  "HUSKY",
  "HUTON",
  "HVCO",
  "HVH",
  "HVI",
  "HVLO",
  "HWL",
  "HXD",
  "HXRO",
  "HYBUX",
  "HYDRA",
  "HYDX",
  "HYGON",
  "HYPC",
  "HYPE",
  "HYPER",
  "HYPERSKIDS",
  "HYPR",
  "HYSON",
  "HYVE",
  "HZN",
  "IAG",
  "IAUON",
  "IBANK",
  "IBFK",
  "IBITON",
  "IBM",
  "IBMB",
  "IBMON",
  "IBMX",
  "IBS",
  "IBTC",
  "IC",
  "ICBX",
  "ICC",
  "ICE",
  "ICHI",
  "ICHRON",
  "ICL",
  "ICNT",
  "ICOB",
  "ICON",
  "ICP",
  "ICPDOWN",
  "ICPUP",
  "ICPX",
  "ICS",
  "ICSA",
  "ICX",
  "ID",
  "ID3L",
  "ID3S",
  "IDEX",
  "IDIA",
  "IDL",
  "IDLE",
  "IDLENFT",
  "IDNA",
  "IDNG",
  "IDOL",
  "IDOS",
  "IDRT",
  "IDRX",
  "IDX",
  "IEFAON",
  "IEFON",
  "IEMGON",
  "IEMGX",
  "IETH",
  "IFAI",
  "IFT",
  "IGU",
  "IGVON",
  "IHC",
  "IJHON",
  "IKA",
  "ILV",
  "ILY",
  "IMAGE",
  "IMAGINE",
  "IMG",
  "IMGN",
  "IMO",
  "IMOUT",
  "IMPACTXP",
  "IMPT",
  "IMS",
  "IMT",
  "IMU",
  "IMX",
  "IN",
  "INC",
  "INCEON",
  "IND",
  "INDAON",
  "INDEX",
  "INDUSTRIAL",
  "INDY",
  "INF",
  "INFO",
  "INFQ",
  "INFRA",
  "ING",
  "INI",
  "INIT",
  "INJ",
  "INKY",
  "INR",
  "INSP",
  "INSURANCE",
  "INTC",
  "INTCB",
  "INTCON",
  "INTCX",
  "INTER",
  "INTL",
  "INTUON",
  "INTW",
  "INTWB",
  "INU",
  "INUINU",
  "INV",
  "INVITE",
  "INX",
  "INXT",
  "IO",
  "IOEN",
  "ION",
  "IONQON",
  "IOST",
  "IOT",
  "IOTA",
  "IOTAI",
  "IOTX",
  "IP",
  "IQ",
  "IQ50",
  "IR",
  "IRC",
  "IREN",
  "IRENA",
  "IRENON",
  "IRENX",
  "IRIS",
  "IRISTOKEN",
  "IRO",
  "IRON",
  "IRT",
  "IRWA",
  "IRYS",
  "ISA",
  "ISHI",
  "ISIKC",
  "ISK",
  "ISLAND",
  "ISLM",
  "ISP",
  "ISRG",
  "ISRGON",
  "IST",
  "ITA",
  "ITAM",
  "ITAON",
  "ITE",
  "ITHACA",
  "ITHEUM",
  "ITO",
  "ITOTON",
  "IUSD",
  "IUSDT",
  "IVFUN",
  "IVPAY",
  "IVT",
  "IVVON",
  "IWC",
  "IWFON",
  "IWM",
  "IWMON",
  "IWMX",
  "IWNON",
  "IXC",
  "IXIC",
  "IXS",
  "IXT",
  "IYWON",
  "IZI",
  "IZKY",
  "J",
  "JAAAON",
  "JACKSON",
  "JADE",
  "JAE",
  "JAGER",
  "JAI",
  "JAIHO",
  "JAIHOZ",
  "JAILSTOOL",
  "JAK",
  "JAM",
  "JANET",
  "JANITOR",
  "JASMY",
  "JASON",
  "JAV",
  "JBC",
  "JBLON",
  "JCT",
  "JDON",
  "JEFE",
  "JEFF",
  "JELLYJELLY",
  "JESUS",
  "JET",
  "JET2",
  "JETTON",
  "JETUSD",
  "JEUR",
  "JEWEL",
  "JEWELRY",
  "JEX",
  "JFI",
  "JFIN",
  "JGGL",
  "JGN",
  "JHH",
  "JIM",
  "JIMOTHY",
  "JIN",
  "JINDO",
  "JITOSOL",
  "JKC",
  "JKL",
  "JLP",
  "JMDT",
  "JMPT",
  "JNB",
  "JNJ",
  "JNJON",
  "JNJX",
  "JOBCOIN",
  "JOBIESS",
  "JOBS",
  "JOBY",
  "JOC",
  "JOE",
  "JOEY",
  "JOJO",
  "JONES",
  "JORGIE",
  "JOS",
  "JOTCHUA",
  "JOULE",
  "JPM",
  "JPMON",
  "JPMORGAN",
  "JPMX",
  "JPYC",
  "JRT",
  "JSM",
  "JSOL",
  "JST",
  "JTO",
  "JTT",
  "JU",
  "JUNO",
  "JUP",
  "JUPITER",
  "JUPSOL",
  "JUPUSD",
  "JUSD",
  "JUSDC",
  "JUSDT",
  "JUV",
  "JVT",
  "JW",
  "JW7",
  "JWT",
  "JYAI",
  "K",
  "K21",
  "KABOSU",
  "KABUTO",
  "KACE",
  "KACY",
  "KAG",
  "KAI",
  "KAIA",
  "KAIO",
  "KAITO",
  "KAKA",
  "KAKI",
  "KALM",
  "KALT",
  "KAMA",
  "KAMIRAI",
  "KAN",
  "KANG",
  "KANGO",
  "KAON",
  "KAP",
  "KAR",
  "KARATE",
  "KARRAT",
  "KARUM",
  "KAS",
  "KASPY",
  "KASTA",
  "KAT",
  "KATA",
  "KAU",
  "KAVA",
  "KAVADOWN",
  "KAVAUP",
  "KBC",
  "KBTC",
  "KCAKE",
  "KCAL",
  "KCS",
  "KCT",
  "KDA",
  "KDAG",
  "KDG",
  "KDK",
  "KDX",
  "KEANU",
  "KEELON",
  "KEEP",
  "KEK",
  "KEKE",
  "KEKEC",
  "KEKIUS",
  "KEL",
  "KEN",
  "KENDU",
  "KENSEI",
  "KEPT",
  "KERMIT",
  "KERNEL",
  "KET",
  "KEX",
  "KEY",
  "KEYCAT",
  "KEYFI",
  "KEYS",
  "KEYSON",
  "KFI",
  "KGEN",
  "KGST",
  "KHACN",
  "KHAI",
  "KHYPE",
  "KIBSHI",
  "KICK",
  "KIKI",
  "KILLA",
  "KILO",
  "KIM",
  "KIMA",
  "KIMBA",
  "KIMBO",
  "KIMCHI",
  "KIMIAI",
  "KIN",
  "KING",
  "KINGY",
  "KINIC",
  "KIOXIA",
  "KIP",
  "KIRO",
  "KISHU",
  "KIT",
  "KITE",
  "KITEAI",
  "KITKAT",
  "KITTI",
  "KITTY",
  "KIZUNA",
  "KLAC",
  "KLACON",
  "KLACX",
  "KLAUS",
  "KLAY",
  "KLC",
  "KLIMA",
  "KLINK",
  "KLIP",
  "KLK",
  "KLO",
  "KLS",
  "KLV",
  "KM",
  "KMD",
  "KMNO",
  "KMON",
  "KNC",
  "KNCH",
  "KNDX",
  "KNG",
  "KNIGHT",
  "KNINE",
  "KNOT",
  "KNOX",
  "KNS",
  "KNT",
  "KNTQ",
  "KNX",
  "KO",
  "KOBAN",
  "KOBO",
  "KOGE",
  "KOGECOIN",
  "KOGIN",
  "KOI",
  "KOIN",
  "KOJI",
  "KOKO",
  "KOKOK",
  "KOLZ",
  "KOM",
  "KOMA",
  "KOMPETE",
  "KONET",
  "KONG",
  "KOON",
  "KOPNON",
  "KORI",
  "KORU",
  "KORUB",
  "KOX",
  "KP3R",
  "KPG",
  "KPOL",
  "KPOP",
  "KRD",
  "KRL",
  "KRO",
  "KRRX",
  "KRS",
  "KRW",
  "KRWQ",
  "KS200",
  "KSHIB",
  "KSM",
  "KSN",
  "KSTR",
  "KSWAP",
  "KT",
  "KTA",
  "KTI",
  "KTN",
  "KTON",
  "KUB",
  "KUJI",
  "KUKU",
  "KULA",
  "KUMA",
  "KUNCI",
  "KURO",
  "KURT",
  "KUVI",
  "KVAI",
  "KWEBON",
  "KWENTA",
  "KXP",
  "KYO",
  "KYVE",
  "KZEN",
  "L1",
  "L1X",
  "L3",
  "LA",
  "LAB",
  "LABUBU",
  "LAC",
  "LADYS",
  "LAI",
  "LAIKA",
  "LAIR",
  "LAK3",
  "LAKE",
  "LAMBO",
  "LANA",
  "LAND",
  "LANLAN",
  "LAPUPU",
  "LAT",
  "LATINA",
  "LAUNCH",
  "LAUNCHCOIN",
  "LAVA",
  "LAVITA",
  "LAYER",
  "LAZIO",
  "LB",
  "LBAI",
  "LBK",
  "LBLOCK",
  "LBM",
  "LBR",
  "LBT",
  "LBTC",
  "LC",
  "LCAI",
  "LCAT",
  "LCC",
  "LCG",
  "LCRO",
  "LCX",
  "LDO",
  "LDZ",
  "LEARN",
  "LEASH",
  "LECOON",
  "LEDGER",
  "LEE",
  "LEG",
  "LEGION",
  "LEGIT",
  "LEMU",
  "LEMX",
  "LENDA",
  "LENDS",
  "LEO",
  "LEOPARD",
  "LEOX",
  "LEPER",
  "LESLIE",
  "LESTER",
  "LET",
  "LETSBONK",
  "LETSGO",
  "LEVE",
  "LF",
  "LFDOG",
  "LFG",
  "LFGO",
  "LFIT",
  "LFNTY",
  "LFUSD",
  "LGNS",
  "LIB",
  "LIBERTY",
  "LIBRA",
  "LICO",
  "LIF3",
  "LIFE",
  "LIGHT",
  "LIGHTER",
  "LIGO",
  "LIKE",
  "LILPUMP",
  "LIME",
  "LIMO",
  "LINA",
  "LINADOWN",
  "LINAUP",
  "LINEA",
  "LINEAR",
  "LINGO",
  "LINK",
  "LINKA",
  "LINON",
  "LINU",
  "LINX",
  "LION",
  "LIQ",
  "LIQQ",
  "LIQUID",
  "LISA",
  "LISTA",
  "LISUSD",
  "LIT",
  "LITE",
  "LITEB",
  "LITEON",
  "LITEX",
  "LITH",
  "LITKEY",
  "LITON",
  "LIVE",
  "LIZA",
  "LIZD",
  "LKI",
  "LKSM",
  "LKT",
  "LKY",
  "LL",
  "LLD",
  "LLM",
  "LLY",
  "LLYON",
  "LLYX",
  "LM",
  "LMCSWAP",
  "LMEOW",
  "LMF",
  "LMI",
  "LMR",
  "LMT",
  "LMTON",
  "LMTS",
  "LMWR",
  "LMY",
  "LN",
  "LNDX",
  "LNQ",
  "LNR",
  "LNS",
  "LOA",
  "LOAFCAT",
  "LOAN",
  "LOBO",
  "LOBSTAR",
  "LOCK",
  "LOCKIN",
  "LOCUS",
  "LODE",
  "LOE",
  "LOFI",
  "LOGX",
  "LOKA",
  "LOKI",
  "LOKY",
  "LOL",
  "LOLCAT",
  "LOLCOIN",
  "LON",
  "LONG",
  "LOOBY",
  "LOOK",
  "LOOKS",
  "LOOM",
  "LOOMDOWN",
  "LOOMUP",
  "LOOP",
  "LOS",
  "LOT",
  "LOU",
  "LOUD",
  "LOULOU",
  "LOVE",
  "LOVELY",
  "LOWB",
  "LOWON",
  "LPL",
  "LPNT",
  "LPT",
  "LPTHON",
  "LQ",
  "LQR",
  "LQTY",
  "LRC",
  "LRCX",
  "LRCXON",
  "LRDS",
  "LRST",
  "LRT",
  "LSC",
  "LSCAT",
  "LSCCON",
  "LSETH",
  "LSK",
  "LSR",
  "LSS",
  "LSWAP",
  "LTC",
  "LTCR",
  "LTP",
  "LTRBT",
  "LTT",
  "LTX",
  "LUCA",
  "LUCE",
  "LUCI",
  "LUCIC",
  "LUCKY",
  "LUCKYSLP",
  "LUFC",
  "LUFFY",
  "LUIGI",
  "LUM",
  "LUMI",
  "LUMIA",
  "LUMINT",
  "LUMIO",
  "LUN",
  "LUNA",
  "LUNADOWN",
  "LUNAM",
  "LUNAUP",
  "LUNC",
  "LUNR",
  "LUNRON",
  "LUR",
  "LUS",
  "LUSD",
  "LUSH",
  "LUX",
  "LV",
  "LVL",
  "LVLY",
  "LVN",
  "LVVA",
  "LX",
  "LYC",
  "LYD",
  "LYFE",
  "LYK",
  "LYN",
  "LYNK",
  "LYNX",
  "LYP",
  "LYRA",
  "LYUM",
  "LYX",
  "M",
  "M-BTC",
  "M3M3",
  "M87",
  "MA",
  "MACMINI",
  "MAD",
  "MAGA",
  "MAGADOGE",
  "MAGAL",
  "MAGAPEPE",
  "MAGASHIB",
  "MAGATRUMP",
  "MAGIC",
  "MAGICK",
  "MAGMA",
  "MAGS",
  "MAIGA",
  "MAIV",
  "MAJO",
  "MAJOR",
  "MAK",
  "MAKA",
  "MAMBO",
  "MAME",
  "MAMO",
  "MAMU",
  "MAN",
  "MANA",
  "MANA3L",
  "MANA3S",
  "MANEKI",
  "MANIA",
  "MANIFEST",
  "MANNA",
  "MANTA",
  "MANTLE",
  "MANTRA",
  "MANYU",
  "MAO",
  "MAON",
  "MAP",
  "MAP2",
  "MAPO",
  "MAPS",
  "MARAON",
  "MARCO",
  "MARIE",
  "MARIO",
  "MARS",
  "MARS4",
  "MARSCOIN",
  "MARSMI",
  "MARSUPILAMI",
  "MART",
  "MARTIA",
  "MARU",
  "MARV",
  "MARVIN",
  "MAS",
  "MASA",
  "MASK",
  "MASKDOWN",
  "MASKUP",
  "MASQ",
  "MAT",
  "MATCH",
  "MATE",
  "MATES",
  "MATH",
  "MATIC",
  "MATIC3L",
  "MATIC3S",
  "MATICX",
  "MATT",
  "MATTLE",
  "MAV",
  "MAVIA",
  "MAX",
  "MAXETH",
  "MAXXING",
  "MAY",
  "MAYA",
  "MAZA",
  "MAZZE",
  "MBC",
  "MBD",
  "MBG",
  "MBGA",
  "MBL",
  "MBLYON",
  "MBOX",
  "MBP",
  "MBS",
  "MBX",
  "MC",
  "MCADE",
  "MCAKE",
  "MCB",
  "MCDON",
  "MCDULL",
  "MCDX",
  "MCEUR",
  "MCG",
  "MCGA",
  "MCH",
  "MCHC",
  "MCM",
  "MCN",
  "MCO2",
  "MCOIN",
  "MCONTENT",
  "MCQ",
  "MCRT",
  "MCT",
  "MCTP",
  "MCUSD",
  "MDAO",
  "MDB",
  "MDC",
  "MDDC",
  "MDOM",
  "MDT",
  "MDTI",
  "MDTX",
  "MDUS",
  "MDX",
  "ME",
  "MEA",
  "MEAN",
  "MEBT",
  "MEC",
  "MECH",
  "MED",
  "MEDIA",
  "MEDUSA",
  "MEDXT",
  "MEE",
  "MEER",
  "MEFA",
  "MEFAI",
  "MEFI",
  "MEGA",
  "MELANIA",
  "MELION",
  "MELLOW",
  "MELO",
  "MELON",
  "MEM",
  "MEMAGX",
  "MEMDEX",
  "MEME",
  "MEMEAI",
  "MEMECOIN",
  "MEMEFI",
  "MEMES",
  "MEMESAI",
  "MEMEX",
  "MEMHASH",
  "MEN",
  "MENGO",
  "MEOW",
  "MEPAD",
  "MERC",
  "MERGE",
  "MERL",
  "MERY",
  "MET",
  "META",
  "METAB",
  "METADAO",
  "METAKPK",
  "METAL",
  "METAMUSK",
  "METAN",
  "METANIA",
  "METAON",
  "METAV",
  "METAX",
  "METFI",
  "METH",
  "METIS",
  "METO",
  "MEV",
  "MEW",
  "MEWC",
  "MEX",
  "MEY",
  "MEZO",
  "MF",
  "MFERS",
  "MFG",
  "MFI",
  "MFT",
  "MGC",
  "MGG",
  "MGKL",
  "MGO",
  "MGP",
  "MGT",
  "MHRD",
  "MIA",
  "MIBR",
  "MICHI",
  "MICKEY",
  "MICRO",
  "MICRODOGE",
  "MIDAS",
  "MIGGLES",
  "MIH",
  "MIHARU",
  "MIL",
  "MILADYCULT",
  "MILK",
  "MILKBAG",
  "MILLI",
  "MILO",
  "MIM",
  "MIMATIC",
  "MIMO",
  "MIN",
  "MINA",
  "MIND",
  "MINDFAK",
  "MINE",
  "MINGO",
  "MINI",
  "MINIDOGE",
  "MINIMA",
  "MINIMAX",
  "MINT",
  "MINU",
  "MIR",
  "MIRA",
  "MIRAI",
  "MIRROR",
  "MISATO",
  "MISHA",
  "MIST",
  "MITH",
  "MITO",
  "MITTENS",
  "MIU",
  "MIVA",
  "MK",
  "MKL",
  "MKR",
  "MKRDOWN",
  "MKRUP",
  "MKUSD",
  "ML",
  "MLC",
  "MLG",
  "MLK",
  "MLN",
  "MLNK",
  "MLP",
  "MLT",
  "MLXC",
  "MM",
  "MMETA",
  "MMF",
  "MMIP",
  "MMIT",
  "MMO",
  "MMPRO",
  "MMSC",
  "MMT",
  "MMUI",
  "MMXN",
  "MNDE",
  "MNFT",
  "MNGO",
  "MNSRY",
  "MNT",
  "MNTC",
  "MNTL",
  "MNTP",
  "MNTX",
  "MNW",
  "MOANI",
  "MOB",
  "MOBILE",
  "MOBY",
  "MOC",
  "MOCA",
  "MOCHI",
  "MODE",
  "MODX",
  "MOE",
  "MOEW",
  "MOG",
  "MOGE",
  "MOGGO",
  "MOJO",
  "MOLECULE",
  "MOLI",
  "MOLK",
  "MOLT",
  "MOLTBOOK",
  "MOLTID",
  "MOMO",
  "MON",
  "MONA",
  "MONET",
  "MONEY",
  "MONG",
  "MONI",
  "MONK",
  "MONKE",
  "MONKEY",
  "MONKY",
  "MONONOKE-INU",
  "MONPRO",
  "MONS",
  "MONSTRO",
  "MOO",
  "MOODENG",
  "MOOLAH",
  "MOOMOO",
  "MOON",
  "MOONCAT",
  "MOONDOGE",
  "MOONED",
  "MOONEY",
  "MOONPIG",
  "MOONSTAR",
  "MOOO",
  "MOOV",
  "MOOVE",
  "MOR",
  "MORE",
  "MORI",
  "MORPHO",
  "MORTY",
  "MOSS",
  "MOST",
  "MOT",
  "MOTA",
  "MOTHER",
  "MOTO",
  "MOUTAI",
  "MOVA",
  "MOVE",
  "MOVEUSD",
  "MOVR",
  "MOWA",
  "MOXIE",
  "MPC",
  "MPDAO",
  "MPH",
  "MPL",
  "MPLX",
  "MPON",
  "MPP",
  "MPRA",
  "MPRO",
  "MPS",
  "MPWR",
  "MPX",
  "MRBEAST",
  "MRDN",
  "MRHB",
  "MRKON",
  "MRKX",
  "MRLIGHTSPEED",
  "MRLN",
  "MRNAON",
  "MRS",
  "MRSOON",
  "MRVL",
  "MRVLB",
  "MRVLON",
  "MRVLX",
  "MRX",
  "MSC",
  "MSFT",
  "MSFTB",
  "MSFTON",
  "MSFTX",
  "MSHD",
  "MSOL",
  "MSQ",
  "MST",
  "MSTR",
  "MSTRB",
  "MSTRON",
  "MSTRX",
  "MSVP",
  "MT",
  "MTA",
  "MTC",
  "MTD",
  "MTG",
  "MTHT",
  "MTK",
  "MTL",
  "MTLS",
  "MTLX",
  "MTO",
  "MTONGA",
  "MTP",
  "MTR",
  "MTRG",
  "MTS",
  "MTSION",
  "MTT",
  "MTV",
  "MTZON",
  "MU",
  "MUB",
  "MUBARAK",
  "MUBARAKAH",
  "MUBI",
  "MULTI",
  "MUMU",
  "MUON",
  "MURA",
  "MUSCAT",
  "MUSD",
  "MUSE",
  "MUSH",
  "MUSIC",
  "MUSKIT",
  "MUSTAAAAAARD",
  "MUU",
  "MUUB",
  "MUX",
  "MV",
  "MVC",
  "MVI",
  "MVL",
  "MVLL",
  "MVLLB",
  "MVP",
  "MVS",
  "MVX",
  "MWC",
  "MWXT",
  "MX",
  "MXC",
  "MXL",
  "MXLON",
  "MXM",
  "MXNA",
  "MXNB",
  "MXNBC",
  "MXNT",
  "MY",
  "MYB",
  "MYRA",
  "MYRGON",
  "MYRIA",
  "MYRO",
  "MYST",
  "MYSTERY",
  "MYTH",
  "MYX",
  "MZK",
  "N2",
  "NABOX",
  "NACHO",
  "NAFT",
  "NAI",
  "NAIIVE",
  "NAKA",
  "NAORIS",
  "NAP",
  "NARS",
  "NAS",
  "NATGAS",
  "NATION",
  "NATIX",
  "NATO",
  "NATON",
  "NAV",
  "NAVAL",
  "NAVI",
  "NAVX",
  "NAWS",
  "NB",
  "NBABSC",
  "NBIS",
  "NBISB",
  "NBISON",
  "NBLU",
  "NBOT",
  "NBT",
  "NC",
  "NCASH",
  "NCDT",
  "NCN",
  "NCOIN",
  "NCT",
  "NDQ",
  "NDX",
  "NEAR",
  "NEEON",
  "NEET",
  "NEFTY",
  "NEGED",
  "NEIRO",
  "NEIROCTO",
  "NEKO",
  "NEMON",
  "NEO",
  "NEOCLOUD",
  "NEON",
  "NEOX",
  "NERO",
  "NES",
  "NESS",
  "NEST",
  "NETKO",
  "NETT",
  "NETVR",
  "NETX",
  "NEU",
  "NEUR",
  "NEURAL",
  "NEURALINK",
  "NEURO",
  "NEURON",
  "NEVA",
  "NEVER",
  "NEWB",
  "NEWT",
  "NEX",
  "NEXA",
  "NEXI",
  "NEXM",
  "NEXO",
  "NEZHA",
  "NFD",
  "NFE",
  "NFLX",
  "NFLXON",
  "NFLXX",
  "NFP",
  "NFT",
  "NFTART",
  "NFTB",
  "NFTD",
  "NFTL",
  "NFTXBT",
  "NGM",
  "NI225",
  "NIANNIAN",
  "NIAO",
  "NIBI",
  "NIGHT",
  "NIKLON",
  "NIKO",
  "NIL",
  "NILA",
  "NIM",
  "NINJA",
  "NINO",
  "NIOON",
  "NITEFEEDER",
  "NITRO",
  "NIX",
  "NIZA",
  "NKEON",
  "NKN",
  "NKYC",
  "NLC",
  "NLS",
  "NMBTC",
  "NMC",
  "NMD",
  "NMR",
  "NMT",
  "NMX",
  "NOBODY",
  "NOCHILL",
  "NOCK",
  "NOCON",
  "NODE",
  "NODL",
  "NOHAT",
  "NOICE",
  "NOK",
  "NOKB",
  "NOKON",
  "NOLAN",
  "NOM",
  "NOMAI",
  "NOMNOM",
  "NOMOX",
  "NOODLE",
  "NOON",
  "NOOT",
  "NORMIE",
  "NOS",
  "NOT",
  "NOTAI",
  "NOTHING",
  "NOTIFAI",
  "NOVA",
  "NOW",
  "NOWON",
  "NPC",
  "NPCS",
  "NPRO",
  "NPT",
  "NPXS",
  "NRG",
  "NRGE",
  "NRN",
  "NRV",
  "NS",
  "NSDQ",
  "NSDX",
  "NSFW",
  "NSK",
  "NST",
  "NSTR",
  "NT",
  "NTE",
  "NTESON",
  "NTK",
  "NTRN",
  "NTX",
  "NU",
  "NUB",
  "NUEON",
  "NULS",
  "NUM",
  "NUMI",
  "NUMMUS",
  "NUNU",
  "NURA",
  "NUSA",
  "NUSD",
  "NUT",
  "NUTS",
  "NUTZ",
  "NUUM",
  "NUX",
  "NVB",
  "NVC",
  "NVDA",
  "NVDAB",
  "NVDAON",
  "NVDAX",
  "NVG8",
  "NVO",
  "NVOON",
  "NVOX",
  "NVT",
  "NVTON",
  "NVTSON",
  "NWS",
  "NXA",
  "NXPC",
  "NXQ",
  "NXRA",
  "NXT",
  "NXUSD",
  "NYA",
  "NYAN",
  "NYM",
  "NYXC",
  "O",
  "O3",
  "O4DX",
  "OAS",
  "OASIS",
  "OATH",
  "OBI",
  "OBOL",
  "OBOT",
  "OBSR",
  "OBT",
  "OCC",
  "OCEAN",
  "OCEANDOWN",
  "OCEANUP",
  "OCICAT",
  "OCP",
  "OCT",
  "OCTA",
  "OCTO",
  "ODDZ",
  "ODIC",
  "ODOS",
  "OETH",
  "OEX",
  "OFC",
  "OFE",
  "OFT",
  "OG",
  "OGD",
  "OGGY",
  "OGN",
  "OGPU",
  "OGY",
  "OHM",
  "OHO",
  "OI",
  "OIHON",
  "OIIAOIIA",
  "OIK",
  "OIL",
  "OILX",
  "OKAYEG",
  "OKB",
  "OKI",
  "OKINAMI",
  "OKLOON",
  "OKTA",
  "OL",
  "OLAS",
  "OLE",
  "OLIVE",
  "OLIVIA",
  "OLT",
  "OLY",
  "OM",
  "OMAX",
  "OMD",
  "OMDB",
  "OMEGA\u200EX",
  "OMFG",
  "OMG",
  "OMI",
  "OMIKAMI",
  "OMNI",
  "OMT",
  "ON",
  "ONDO",
  "ONDS",
  "ONDSON",
  "ONDSX",
  "ONE",
  "ONED",
  "ONG",
  "ONI",
  "ONION",
  "ONL",
  "ONON",
  "ONT",
  "ONTACT",
  "ONTOON",
  "ONX",
  "OOB",
  "OOE",
  "OOKI",
  "OORT",
  "OP",
  "OP2L",
  "OP2S",
  "OPAI",
  "OPAL",
  "OPDOWN",
  "OPEN",
  "OPENAI",
  "OPENON",
  "OPENX",
  "OPERATOR",
  "OPG",
  "OPIUM",
  "OPN",
  "OPRAON",
  "OPT",
  "OPTI",
  "OPUL",
  "OPUP",
  "OPUS",
  "ORA",
  "ORAI",
  "ORANGE DIAMOND",
  "ORBD",
  "ORBIO",
  "ORBR",
  "ORBS",
  "ORBT",
  "ORBXON",
  "ORC",
  "ORCA",
  "ORCL",
  "ORCLB",
  "ORCLON",
  "ORCLX",
  "ORDER",
  "ORDI",
  "ORDS",
  "ORE",
  "OREO",
  "ORGO",
  "ORI",
  "ORION",
  "ORN",
  "ORO",
  "ORT",
  "ORTA",
  "OSAK",
  "OSCAR",
  "OSCR",
  "OSCRON",
  "OSETH",
  "OSHI",
  "OSK",
  "OSK-DAO",
  "OSMO",
  "OSOL",
  "OTK",
  "OUSD",
  "OUSTON",
  "OUT",
  "OUTLAW",
  "OVATO",
  "OVER",
  "OVL",
  "OVN",
  "OVO",
  "OVPP",
  "OVR",
  "OWB",
  "OWC",
  "OWL",
  "OWN",
  "OX",
  "OXA",
  "OXI",
  "OXT",
  "OXY",
  "OXYON",
  "OZO",
  "OZONE",
  "P",
  "P2P",
  "P2PS",
  "PAAL",
  "PAC",
  "PACE",
  "PACK",
  "PACOCA",
  "PACT",
  "PAI",
  "PAIN",
  "PAJAMAS",
  "PAK",
  "PAL",
  "PALCOIN",
  "PALLON",
  "PALM",
  "PALMO",
  "PALU",
  "PAN",
  "PANDA",
  "PANDO",
  "PANDORA",
  "PANDU",
  "PANW",
  "PANWON",
  "PANWX",
  "PAPARAZZI",
  "PAPPLE",
  "PAR",
  "PARADOX",
  "PART",
  "PARTI",
  "PASG",
  "PATEK",
  "PATLU",
  "PATRIOT",
  "PAVEON",
  "PAW",
  "PAWS",
  "PAX",
  "PAXG",
  "PAYAI",
  "PAYP",
  "PAYS",
  "PAYU",
  "PBRON",
  "PBTC",
  "PBUX",
  "PBX",
  "PC",
  "PCAT",
  "PCGON",
  "PCI",
  "PCNT",
  "PCT",
  "PDA",
  "PDBCON",
  "PDD",
  "PDDON",
  "PDJT",
  "PDOGE",
  "PDT",
  "PDX",
  "PE",
  "PEAK",
  "PEANIE",
  "PEANUT",
  "PEAQ",
  "PEAR",
  "PEAS",
  "PEDRO",
  "PEEPO",
  "PEEPS",
  "PEEZY",
  "PEFI",
  "PEG",
  "PEIPEI",
  "PELL",
  "PEN",
  "PENDLE",
  "PENG",
  "PENGO",
  "PENGON",
  "PENGU",
  "PENGUIN",
  "PENGY",
  "PEOPLE",
  "PEP",
  "PEPA",
  "PEPE",
  "PEPE2.0",
  "PEPEAI",
  "PEPEC",
  "PEPECHAIN",
  "PEPECOIN",
  "PEPEDNA",
  "PEPEMAGA",
  "PEPEMUSK",
  "PEPENODE",
  "PEPEONTRON",
  "PEPEW",
  "PEPO",
  "PEPON",
  "PEPONK",
  "PEPPER",
  "PEPU",
  "PEPX",
  "PER",
  "PERL",
  "PERP",
  "PERRY",
  "PESHI",
  "PESTO",
  "PETAH",
  "PETS",
  "PETUNIA",
  "PEW",
  "PEX",
  "PF",
  "PFEON",
  "PFEX",
  "PFF",
  "PFL",
  "PFROG",
  "PGON",
  "PGPT",
  "PGX",
  "PHA",
  "PHAR",
  "PHASMA",
  "PHB",
  "PHI",
  "PHIL",
  "PHL",
  "PHNIX",
  "PHOTON",
  "PHR",
  "PHTR",
  "PHY",
  "PI",
  "PIAI",
  "PIB",
  "PICA",
  "PIEVERSE",
  "PIF",
  "PIG",
  "PIGE",
  "PIGGY",
  "PIKA",
  "PIKACHU",
  "PIKASTER2",
  "PILL",
  "PIN",
  "PINE",
  "PINETWORKDEFI",
  "PING",
  "PINGPONG",
  "PINK",
  "PINO",
  "PINS",
  "PINSON",
  "PINU",
  "PINU100X",
  "PINX",
  "PIP",
  "PIPE",
  "PIPEDOG",
  "PIPPIN",
  "PIPPKIN",
  "PIRATE",
  "PISCES",
  "PIT",
  "PITCH",
  "PIVX",
  "PIX",
  "PIXEL",
  "PIXFI",
  "PKB",
  "PKG",
  "PKM",
  "PKN",
  "PKOIN",
  "PKT",
  "PLA",
  "PLAI",
  "PLANCK",
  "PLANE",
  "PLANET",
  "PLATA",
  "PLAY",
  "PLB",
  "PLBT",
  "PLC",
  "PLI",
  "PLN",
  "PLNC",
  "PLON",
  "PLOT",
  "PLPA",
  "PLQ",
  "PLR",
  "PLS",
  "PLSB",
  "PLSPAD",
  "PLSX",
  "PLTR",
  "PLTRB",
  "PLTRON",
  "PLTRX",
  "PLU",
  "PLUGON",
  "PLUME",
  "PLX",
  "PLY",
  "PM",
  "PMA",
  "PMG",
  "PMT",
  "PMUSD",
  "PMX",
  "PNDC",
  "PNDN",
  "PNG",
  "PNIC",
  "PNK",
  "PNP",
  "PNT",
  "PNUT",
  "POA",
  "POCAT",
  "POCHITA",
  "POCO",
  "POET",
  "POFU",
  "POGS",
  "POKERFI",
  "POKT",
  "POL",
  "POLA",
  "POLC",
  "POLIS",
  "POLK",
  "POLLEN",
  "POLLY",
  "POLS",
  "POLY",
  "POLYCUB",
  "POLYDOGE",
  "POLYX",
  "POM",
  "PONCHO",
  "POND",
  "PONGO",
  "PONKE",
  "PONS",
  "PONZI",
  "POOCOIN",
  "POODL",
  "POOF",
  "POOH",
  "POOL",
  "POOLX",
  "POOP",
  "POP",
  "POPCAT",
  "POPDOG",
  "POPG",
  "POPMART",
  "POR",
  "PORK",
  "PORNROCKET",
  "PORT",
  "PORT3",
  "PORTAL",
  "PORTALS",
  "PORTO",
  "POSI",
  "POST",
  "POSW",
  "POT",
  "POTS",
  "POU",
  "POWER",
  "POWLON",
  "POWR",
  "POWSCHE",
  "POX",
  "PPC",
  "PPCOIN",
  "PPFT",
  "PPI",
  "PPLTON",
  "PPLTX",
  "PPT",
  "PRAI",
  "PRARE",
  "PRCL",
  "PRCY",
  "PRE",
  "PREDIC",
  "PREME",
  "PREOPAI",
  "PRESPCX",
  "PRFI",
  "PRGN",
  "PRI",
  "PRICELESS",
  "PRICK",
  "PRIMAL",
  "PRIME",
  "PRISM",
  "PRIV",
  "PRIX",
  "PRL",
  "PRO",
  "PROJECT89",
  "PROM",
  "PROMPT",
  "PROOF",
  "PROPC",
  "PROPS",
  "PROS",
  "PROTEO",
  "PROVE",
  "PRQ",
  "PRT",
  "PRX",
  "PRZS",
  "PS",
  "PSB",
  "PSG",
  "PSI",
  "PSP",
  "PSQON",
  "PSTAKE",
  "PSYOPANIME",
  "PT",
  "PTB",
  "PTC",
  "PTEK",
  "PTH",
  "PTRUMP",
  "PUBLIC",
  "PUFETH",
  "PUFF",
  "PUFFER",
  "PUGAI",
  "PUGG",
  "PUGWIF",
  "PULSE",
  "PUMP",
  "PUMPAI",
  "PUMPBTC",
  "PUMPCADE",
  "PUNCH",
  "PUNCHI",
  "PUNDIAI",
  "PUNDIX",
  "PUNDU",
  "PUNK",
  "PUP",
  "PUPPIES",
  "PUPS",
  "PURR",
  "PURRON",
  "PUSD",
  "PUSH",
  "PUSS",
  "PUSSY",
  "PVC",
  "PVP",
  "PVT",
  "PVU",
  "PWEASE",
  "PWOG",
  "PWRON",
  "PWT",
  "PX",
  "PXC",
  "PXI",
  "PXP",
  "PYBOBO",
  "PYM",
  "PYPL",
  "PYPLB",
  "PYPLON",
  "PYPLX",
  "PYR",
  "PYTH",
  "PYTHIA",
  "PYUSD",
  "PZM",
  "PZP",
  "Q",
  "QAAGAI",
  "QAIT",
  "QANX",
  "QBC",
  "QBIT",
  "QBTSON",
  "QBX",
  "QCAD",
  "QCK",
  "QCOM",
  "QCOMB",
  "QCOMON",
  "QF",
  "QFI",
  "QGOLD",
  "QGOV",
  "QI",
  "QIE",
  "QKC",
  "QKITTY",
  "QNT",
  "QNTB",
  "QNTX",
  "QOM",
  "QONE",
  "QORPO",
  "QORT",
  "QPAY",
  "QQQ",
  "QQQB",
  "QQQON",
  "QQQX",
  "QRL",
  "QRX",
  "QSP",
  "QST",
  "QTC",
  "QTCC",
  "QTO",
  "QTUM",
  "QTUMON",
  "QUACK",
  "QUAI",
  "QUAIN",
  "QUANTUM",
  "QUBIC",
  "QUBTON",
  "QUBY",
  "QUICK",
  "QUILL",
  "QUO",
  "QUQ",
  "QWLA",
  "QWT",
  "QYLDON",
  "R/SNOOFI",
  "R1",
  "R2",
  "RAAOI",
  "RAAPL",
  "RABBIT",
  "RABI",
  "RACA",
  "RAD",
  "RADAR",
  "RADIO",
  "RADR",
  "RADX",
  "RAFF",
  "RAGE",
  "RAGEGUY",
  "RAI",
  "RAIL",
  "RAILS",
  "RAIN",
  "RALLY",
  "RAM",
  "RAMA",
  "RAMAT",
  "RAMD",
  "RAMP",
  "RAMZN",
  "RANET",
  "RAPTOR",
  "RARE",
  "RARI",
  "RARM",
  "RASML",
  "RASTS",
  "RAT",
  "RATING",
  "RATO",
  "RATS",
  "RAVANA",
  "RAVE",
  "RAVEN",
  "RAVGO",
  "RAXTI",
  "RAY",
  "RAZOR",
  "RBABA",
  "RBBT",
  "RBC",
  "RBD",
  "RBE",
  "RBIES",
  "RBLX",
  "RBLXX",
  "RBN",
  "RBNT",
  "RBR",
  "RBT",
  "RBTC",
  "RC",
  "RCADE",
  "RCATX",
  "RCBRS",
  "RCH",
  "RCHV",
  "RCIEN",
  "RCKT",
  "RCLW",
  "RCM",
  "RCN",
  "RCOHR",
  "RCOIN",
  "RCON",
  "RCRCL",
  "RCRDO",
  "RCRWV",
  "RCSCO",
  "RCX",
  "RDD",
  "RDDT",
  "RDDTON",
  "RDELL",
  "RDN",
  "RDNT",
  "RDO",
  "RDRAM",
  "RDW",
  "RDWON",
  "RE",
  "REACT",
  "READY",
  "REAL",
  "REALESTATE",
  "REALIS",
  "REAT",
  "REAU",
  "RECA",
  "RECALL",
  "RECON",
  "RECORD",
  "RECT",
  "RED",
  "REDO",
  "REDSTONE",
  "REEF",
  "REF",
  "REGEN",
  "REGENT",
  "REGI",
  "REGNON",
  "REGRET",
  "REI",
  "REIGN",
  "REKT",
  "REM",
  "REMXON",
  "REN",
  "RENBTC",
  "RENDER",
  "RENEC",
  "RENQ",
  "RENZEC",
  "REP",
  "REPPO",
  "REQ",
  "RESOLV",
  "RET",
  "RETARD",
  "RETARDIO",
  "RETH",
  "RETIK",
  "REV",
  "REV3L",
  "REVO",
  "REVU",
  "REVV",
  "REWY",
  "REX",
  "REXBT",
  "REXHAT",
  "REZ",
  "RFC",
  "RFD",
  "RFL",
  "RFOX",
  "RFR",
  "RFRM",
  "RFUEL",
  "RFUTU",
  "RGOOGL",
  "RGT",
  "RGTION",
  "RH",
  "RHEA",
  "RHOOD",
  "RIA",
  "RIAL",
  "RIB",
  "RIBBIT",
  "RIBM",
  "RICE",
  "RIDE",
  "RIF",
  "RIFT",
  "RING",
  "RINTC",
  "RIO",
  "RION",
  "RIONQ",
  "RIOTON",
  "RIREN",
  "RIS",
  "RISE",
  "RITA",
  "RITE",
  "RIV",
  "RIVER",
  "RIVERPTS",
  "RIVN",
  "RIVNON",
  "RIZ",
  "RIZE",
  "RIZO",
  "RIZZMAS",
  "RJOBY",
  "RJV",
  "RKLB",
  "RKLBB",
  "RKLBON",
  "RLB",
  "RLC",
  "RLITE",
  "RLLY",
  "RLP",
  "RLRCX",
  "RLS",
  "RLUSD",
  "RLY",
  "RM",
  "RMBCASH",
  "RMETA",
  "RMP",
  "RMRK",
  "RMRVL",
  "RMSFT",
  "RMSTR",
  "RMU",
  "RMV",
  "RNA",
  "RNBIS",
  "RNBW",
  "RNDR",
  "RNDRUP",
  "RNOK",
  "RNOW",
  "RNT",
  "RNVDA",
  "ROA",
  "ROAM",
  "ROAR",
  "ROB",
  "ROBO",
  "ROBOT",
  "ROBOTS",
  "ROCK",
  "ROCKET",
  "ROCKETFI",
  "ROCKY",
  "ROCO",
  "RODAI",
  "ROE",
  "ROG",
  "ROI",
  "ROK",
  "ROKLO",
  "ROKO",
  "ROKON",
  "ROLL",
  "ROLLSROYCE",
  "RON",
  "ROND",
  "RONDS",
  "RONIN",
  "ROOBEE",
  "ROOK",
  "ROOST",
  "ROOT",
  "RORCL",
  "ROSE",
  "ROSS",
  "ROT",
  "ROU",
  "ROUTE",
  "ROUTINE",
  "ROVR",
  "ROY",
  "RP1",
  "RPC",
  "RPD",
  "RPEPE",
  "RPG",
  "RPL",
  "RPLAY",
  "RPLTR",
  "RPTR",
  "RPZX",
  "RQBTS",
  "RQCOM",
  "RQQQ",
  "RRDW",
  "RRGTI",
  "RRKLB",
  "RRT",
  "RS",
  "RSC",
  "RSETH",
  "RSIMO",
  "RSMCI",
  "RSNDK",
  "RSO",
  "RSOFI",
  "RSOXL",
  "RSOXS",
  "RSPCX",
  "RSPY",
  "RSQQQ",
  "RSR",
  "RSS3",
  "RSTX",
  "RSWETH",
  "RTF",
  "RTM",
  "RTPBET",
  "RTQQQ",
  "RTR",
  "RTSLA",
  "RTSM",
  "RTX",
  "RTXON",
  "RUBY",
  "RUG",
  "RUJI",
  "RUM",
  "RUN",
  "RUNE",
  "RUNECOIN",
  "RUNWAGO",
  "RURI",
  "RUSAR",
  "RUSSELL",
  "RVC",
  "RVF",
  "RVM",
  "RVN",
  "RVT",
  "RVV",
  "RWA",
  "RWAI",
  "RWAINC",
  "RWDC",
  "RWS",
  "RWT",
  "RXD",
  "RXS",
  "RXT",
  "RYO",
  "RYOSHI",
  "RYS",
  "RYU",
  "RZ",
  "RZR",
  "RZTO",
  "RZUSD",
  "S",
  "S&P500",
  "S315",
  "SA",
  "SAAD",
  "SABAI",
  "SAC",
  "SACKS",
  "SAD",
  "SAFA",
  "SAFE",
  "SAFEBULL",
  "SAFEMARS",
  "SAFEMOONCASH",
  "SAFU",
  "SAFUU",
  "SAGA",
  "SAGE",
  "SAGIT",
  "SAHARA",
  "SAI",
  "SAINT",
  "SAITAMA",
  "SAITO",
  "SAKAI",
  "SAL",
  "SALT",
  "SAM",
  "SAMO",
  "SAN",
  "SAND",
  "SAND3L",
  "SAND3S",
  "SANDG",
  "SANTA",
  "SANTACOIN",
  "SANTOS",
  "SAPIEN",
  "SAPON",
  "SARAH",
  "SAROS",
  "SAT",
  "SATA",
  "SATAON",
  "SATO",
  "SATOSHI",
  "SATOX",
  "SATOZ",
  "SATS",
  "SATT",
  "SAUBER",
  "SAUCE",
  "SAVAX",
  "SAVE",
  "SAVM",
  "SB",
  "SBAE",
  "SBC",
  "SBD",
  "SBET",
  "SBETON",
  "SBETX",
  "SBF",
  "SBONK",
  "SBR",
  "SBT",
  "SBTC",
  "SBUXON",
  "SC",
  "SCA",
  "SCAM",
  "SCAN",
  "SCARCITY",
  "SCC",
  "SCCOON",
  "SCCP",
  "SCF",
  "SCHFX",
  "SCHRODI",
  "SCHWON",
  "SCI",
  "SCIHUB",
  "SCM",
  "SCOP",
  "SCOR",
  "SCORPIO",
  "SCOTTY",
  "SCP",
  "SCPT",
  "SCR",
  "SCRAT",
  "SCRT",
  "SCRVUSD",
  "SCS",
  "SCT",
  "SD",
  "SDAI",
  "SDAO",
  "SDEX",
  "SDG",
  "SDL",
  "SDM",
  "SDOGE",
  "SDT",
  "SEA",
  "SEAM",
  "SEAS",
  "SEBA",
  "SECOND",
  "SECT",
  "SEDA",
  "SEDGON",
  "SEED",
  "SEEK",
  "SEI",
  "SEKOIA",
  "SELF",
  "SELFIE",
  "SEN",
  "SENATE",
  "SEND",
  "SENDOR",
  "SENSO",
  "SENT",
  "SENTAI",
  "SENTIS",
  "SEOR",
  "SEP",
  "SERAPH",
  "SERSH",
  "SERV",
  "SESH",
  "SFA",
  "SFD",
  "SFG",
  "SFI",
  "SFIT",
  "SFL",
  "SFM",
  "SFP",
  "SFRXETH",
  "SFRXUSD",
  "SFUND",
  "SFX",
  "SG",
  "SGB",
  "SGD",
  "SGI",
  "SGOVON",
  "SGR",
  "SGT",
  "SHA",
  "SHACK",
  "SHADOW",
  "SHAR",
  "SHARBI",
  "SHARDS",
  "SHARE",
  "SHARK",
  "SHARKI",
  "SHARKS",
  "SHARP",
  "SHAZ",
  "SHDW",
  "SHDX",
  "SHEB",
  "SHEESHA",
  "SHEGEN",
  "SHELL",
  "SHEN",
  "SHFL",
  "SHFT",
  "SHI",
  "SHIA",
  "SHIB",
  "SHIB0.5",
  "SHIB2.0",
  "SHIBA",
  "SHIBA 2.0",
  "SHIBAAI",
  "SHIBAI",
  "SHIBDOGE",
  "SHIBKILLER",
  "SHIBU",
  "SHICO",
  "SHIDO",
  "SHIELD",
  "SHIFU",
  "SHIH",
  "SHIK",
  "SHIKOKU",
  "SHILL",
  "SHINJI",
  "SHIRO",
  "SHIRYO",
  "SHISA",
  "SHITCOIN",
  "SHIV",
  "SHL",
  "SHLD",
  "SHLDON",
  "SHM",
  "SHOGGOTH",
  "SHOP",
  "SHOPON",
  "SHORK",
  "SHORT",
  "SHOW",
  "SHPING",
  "SHR",
  "SHRAP",
  "SHRED",
  "SHROOM",
  "SHRUB",
  "SHRUBIUS",
  "SHX",
  "SHY",
  "SHYON",
  "SI",
  "SIB",
  "SIDUS",
  "SIENNA",
  "SIFU",
  "SIGMA",
  "SIGN",
  "SIGNA",
  "SILENTIS",
  "SILLY",
  "SILO",
  "SILON",
  "SILVER",
  "SIMMI",
  "SIMO",
  "SIMPSON",
  "SIMPSONS",
  "SIN",
  "SINGLE",
  "SINGULARRY",
  "SIPHER",
  "SIREN",
  "SIRIUS",
  "SIS",
  "SISC",
  "SISHI",
  "SIX",
  "SIXP",
  "SIZE",
  "SKAI",
  "SKATE",
  "SKBDI",
  "SKEB",
  "SKETCH",
  "SKEY",
  "SKHY",
  "SKHYB",
  "SKHYON",
  "SKHYX",
  "SKI",
  "SKIBIDI",
  "SKICAT",
  "SKID",
  "SKILL",
  "SKINUT",
  "SKITTEN",
  "SKL",
  "SKOP",
  "SKR",
  "SKRT",
  "SKULL",
  "SKX",
  "SKY",
  "SKYA",
  "SKYAI",
  "SL",
  "SLAP",
  "SLAY",
  "SLB",
  "SLBON",
  "SLC",
  "SLERF",
  "SLICE",
  "SLIM",
  "SLIME",
  "SLIPPY",
  "SLISBNB",
  "SLISBNBX",
  "SLIZ",
  "SLND",
  "SLOP",
  "SLOTH",
  "SLP",
  "SLRS",
  "SLS",
  "SLT",
  "SLV",
  "SLVN",
  "SLVON",
  "SLVX",
  "SLX",
  "SMARS",
  "SMART",
  "SMARTCREDIT",
  "SMCI",
  "SMCION",
  "SMCIX",
  "SMF",
  "SMH",
  "SMHB",
  "SMHX",
  "SMILEK",
  "SMILEY",
  "SMOG",
  "SMOL",
  "SMOLE",
  "SMOON",
  "SMRAT",
  "SMRON",
  "SMRTR",
  "SMT",
  "SMURFCAT",
  "SMX",
  "SN",
  "SN10",
  "SN11",
  "SN12",
  "SN120",
  "SN13",
  "SN14",
  "SN15",
  "SN17",
  "SN25",
  "SN3",
  "SN33",
  "SN34",
  "SN4",
  "SN41",
  "SN44",
  "SN46",
  "SN47",
  "SN5",
  "SN51",
  "SN53",
  "SN56",
  "SN59",
  "SN62",
  "SN63",
  "SN64",
  "SN68",
  "SN73",
  "SN75",
  "SN79",
  "SN84",
  "SN88",
  "SN9",
  "SN93",
  "SNA",
  "SNACK",
  "SNAI",
  "SNAKES",
  "SNAKT",
  "SNAPON",
  "SNC",
  "SNDK",
  "SNDKB",
  "SNDKON",
  "SNDKX",
  "SNEED",
  "SNEK",
  "SNFT",
  "SNL",
  "SNOB",
  "SNOOPY",
  "SNORT",
  "SNOW",
  "SNOWON",
  "SNPAD",
  "SNPT",
  "SNRG",
  "SNS",
  "SNSY",
  "SNT",
  "SNTR",
  "SNUSD",
  "SNX",
  "SNXX",
  "SNXXB",
  "SOAR",
  "SOBER",
  "SOCA",
  "SOCC",
  "SOFAC",
  "SOFI",
  "SOFION",
  "SOFTWARE.AI",
  "SOGNI",
  "SOIL",
  "SOKU",
  "SOL",
  "SOLALA",
  "SOLAMA",
  "SOLANA",
  "SOLAPE",
  "SOLARIS",
  "SOLBOX",
  "SOLC",
  "SOLCAT",
  "SOLCEX",
  "SOLIB",
  "SOLID",
  "SOLNIC",
  "SOLO",
  "SOLPAD",
  "SOLS",
  "SOLV",
  "SOLVBTC",
  "SOLVE",
  "SOLVEX",
  "SOLX",
  "SOLZILLA",
  "SOMI",
  "SOMM",
  "SON",
  "SONG",
  "SONIC",
  "SONNE",
  "SONY",
  "SOON",
  "SOPH",
  "SORA",
  "SORADOGE",
  "SOS",
  "SOSANA",
  "SOSO",
  "SOUL",
  "SOUNON",
  "SOURCE",
  "SOV",
  "SOVRN",
  "SOXL",
  "SOXLB",
  "SOXLON",
  "SOXLX",
  "SOXS",
  "SOXSB",
  "SOXSON",
  "SOXXON",
  "SOXXX",
  "SOY",
  "SP",
  "SPA",
  "SPACE",
  "SPACEPI",
  "SPACEX",
  "SPADE",
  "SPAIN",
  "SPARKLET",
  "SPARTA",
  "SPC",
  "SPCEX",
  "SPCM",
  "SPCT",
  "SPCX",
  "SPCXB",
  "SPCXON",
  "SPCXX",
  "SPD",
  "SPDR",
  "SPE",
  "SPEC",
  "SPECTRA",
  "SPECTRE",
  "SPEED",
  "SPEEDY",
  "SPELL",
  "SPELLFIRE",
  "SPEND",
  "SPFC",
  "SPGION",
  "SPHYNX",
  "SPIDERMAN",
  "SPIKE",
  "SPIN",
  "SPK",
  "SPLD",
  "SPO",
  "SPON",
  "SPONGE",
  "SPORE",
  "SPORT",
  "SPOT",
  "SPOTON",
  "SPR",
  "SPRING",
  "SPS",
  "SPURS",
  "SPWR",
  "SPX",
  "SPX2.0",
  "SPX6969",
  "SPXC",
  "SPY",
  "SPYB",
  "SPYON",
  "SPYX",
  "SQD",
  "SQGROW",
  "SQQQ",
  "SQQQON",
  "SQR",
  "SQT",
  "SQUAD",
  "SQUID",
  "SQUOGE",
  "SRK",
  "SRM",
  "SRN",
  "SRX",
  "SSE",
  "SSG",
  "SSHIB",
  "SSLX",
  "SSOL",
  "SSS",
  "SSSSS",
  "SSU",
  "SSV",
  "SSX",
  "ST",
  "STABLE",
  "STAC",
  "STACCANA",
  "STAKE",
  "STAPT",
  "STAR",
  "STAR10",
  "STARL",
  "STARS",
  "STARSHIP",
  "START",
  "STARTUP",
  "STASH",
  "STAT",
  "STATE",
  "STATOM",
  "STAU",
  "STAVAX",
  "STAY",
  "STB",
  "STBL",
  "STBT",
  "STBU",
  "STC",
  "STEEM",
  "STEMX",
  "STEP",
  "STETH",
  "STG",
  "STI",
  "STIK",
  "STIMA",
  "STIX",
  "STJUNO",
  "STKAAVE",
  "STKGHO",
  "STLS",
  "STM",
  "STMATIC",
  "STMON",
  "STMX",
  "STNEAR",
  "STNK",
  "STO",
  "STOC",
  "STON",
  "STONKS",
  "STOOS",
  "STOP",
  "STORJ",
  "STORJDOWN",
  "STORJUP",
  "STORM",
  "STOS",
  "STOSMO",
  "STR",
  "STRAX",
  "STRAYDOG",
  "STRC",
  "STRCON",
  "STRCX",
  "STRD",
  "STREAM",
  "STREAMER",
  "STRIKE",
  "STRK",
  "STRM",
  "STRNGR",
  "STRONG",
  "STRSZN",
  "STRUMP",
  "STRX",
  "STSHIP",
  "STSOL",
  "STT",
  "STTIA",
  "STTON",
  "STUFF",
  "STUPID",
  "STUSDT",
  "STX",
  "STXDOWN",
  "STXON",
  "STXUP",
  "STZU",
  "SUAI",
  "SUB",
  "SUCHIR",
  "SUGAR",
  "SUI",
  "SUIA",
  "SUIB",
  "SUIDEPIN",
  "SUIMAN",
  "SUIP",
  "SUKU",
  "SUL",
  "SUMMER",
  "SUMMIT",
  "SUN",
  "SUNCAT",
  "SUNDAE",
  "SUNDOG",
  "SUP",
  "SUPE",
  "SUPER",
  "SUPERCYCLE",
  "SUPERGROK",
  "SUPRA",
  "SURE",
  "SURGE",
  "SUSD",
  "SUSD1+",
  "SUSDD",
  "SUSDE",
  "SUSDT",
  "SUSHI",
  "SUT",
  "SVL",
  "SVN",
  "SVPN",
  "SVSA",
  "SVTS",
  "SWAN",
  "SWAP",
  "SWARMS",
  "SWASH",
  "SWAY",
  "SWC",
  "SWCH",
  "SWEAT",
  "SWEETS",
  "SWELL",
  "SWETH",
  "SWFTC",
  "SWGT",
  "SWIFT",
  "SWIN",
  "SWING",
  "SWISE",
  "SWITCH",
  "SWOL",
  "SWORLD",
  "SWPX",
  "SWRX",
  "SWT",
  "SWTCH",
  "SWTS",
  "SXC",
  "SXP",
  "SXPDOWN",
  "SXPUP",
  "SXT",
  "SYA",
  "SYK",
  "SYL",
  "SYLO",
  "SYMETRAX",
  "SYMM",
  "SYMON",
  "SYN",
  "SYND",
  "SYNTH",
  "SYP",
  "SYRUP",
  "SYRUPUSDC",
  "SYRUPUSDT",
  "SYS",
  "SZCB",
  "SZN",
  "T",
  "T6900",
  "T99",
  "TA",
  "TABOO",
  "TAC",
  "TACC",
  "TADA",
  "TAG",
  "TAI",
  "TAIKO",
  "TAIX",
  "TAJ",
  "TAKE",
  "TAKER",
  "TAKO",
  "TAL",
  "TALE",
  "TALENT",
  "TALNT",
  "TANGYUAN",
  "TANSSI",
  "TANUKI",
  "TAO",
  "TAOBOT",
  "TAOCAT",
  "TAONU",
  "TAOT",
  "TAP",
  "TAPS",
  "TARA",
  "TARDI",
  "TARO",
  "TAROT",
  "TASSHUB",
  "TAT",
  "TATE",
  "TATSU",
  "TAUM",
  "TAUR",
  "TAURUS",
  "TAVA",
  "TBC",
  "TBCC",
  "TBK",
  "TBLLX",
  "TBT",
  "TBTC",
  "TBULL",
  "TBX",
  "TC",
  "TCAPY",
  "TCAT",
  "TCC",
  "TCOM",
  "TCOMON",
  "TCT",
  "TCU29",
  "TDE",
  "TDN",
  "TDROP",
  "TDS",
  "TEA",
  "TEAFI",
  "TECH",
  "TEL",
  "TELEBTC",
  "TELON",
  "TEM",
  "TEMA",
  "TEMCO",
  "TEN",
  "TENCENT",
  "TENCENTAI",
  "TENFI",
  "TENGE",
  "TENON",
  "TER",
  "TERA",
  "TERMINUS",
  "TERON",
  "TERRA",
  "TERX",
  "TESLAI",
  "TET",
  "TETH",
  "TEVA",
  "TFI",
  "TFS",
  "TFT",
  "TFUEL",
  "TGBP",
  "TGC",
  "TGT",
  "TH",
  "THALES",
  "THC",
  "THE",
  "THECAT",
  "THEROS",
  "THETA",
  "THG",
  "THINK",
  "THL",
  "THOR",
  "THQ",
  "THR",
  "THREE",
  "THT",
  "THUG",
  "TIA",
  "TIBBIR",
  "TICO",
  "TICS",
  "TIFI",
  "TIG",
  "TIGERMOON",
  "TIGRES",
  "TIME",
  "TIMELESS",
  "TIMI",
  "TINU",
  "TIPON",
  "TIT",
  "TITAN",
  "TITANX",
  "TITCOIN",
  "TITI",
  "TITN",
  "TITS",
  "TJRM",
  "TKC",
  "TKG",
  "TKN",
  "TKO",
  "TKP",
  "TLM",
  "TLNON",
  "TLOS",
  "TLTON",
  "TMAI",
  "TMF",
  "TMG",
  "TMN",
  "TMON",
  "TMOON",
  "TMOX",
  "TMUSON",
  "TMX",
  "TNS",
  "TNSR",
  "TOAD",
  "TOBI",
  "TOBY",
  "TOESCOIN",
  "TOILET",
  "TOKABU",
  "TOKAMAK",
  "TOKE",
  "TOKEN",
  "TOKERO",
  "TOKI",
  "TOKO",
  "TOMAN",
  "TOMI",
  "TON",
  "TONALD",
  "TONE",
  "TONIC",
  "TONNEL",
  "TONXX",
  "TOOKER",
  "TOOTHLESS",
  "TOP",
  "TOPG",
  "TORA",
  "TORI",
  "TORN",
  "TORSY",
  "TOS",
  "TOSHE",
  "TOSHI",
  "TOTAKEKE",
  "TOTEM",
  "TOTO",
  "TOTT",
  "TOWELI",
  "TOWER",
  "TOWN",
  "TOWNS",
  "TOYSTORY",
  "TPAD",
  "TPRO",
  "TPT",
  "TPTU",
  "TQQQ",
  "TQQQB",
  "TQQQON",
  "TQQQX",
  "TRA",
  "TRAC",
  "TRACE",
  "TRACTOR",
  "TRADE",
  "TRADOOR",
  "TRAI",
  "TRAIN",
  "TRALA",
  "TRASH",
  "TRAXX",
  "TRB",
  "TRBDOWN",
  "TRBUP",
  "TRC",
  "TRCL",
  "TRD",
  "TREAT",
  "TREE",
  "TREEINCAT",
  "TREMP",
  "TRENCHAI",
  "TRENCHER",
  "TRHUB",
  "TRI",
  "TRIA",
  "TRIAD",
  "TRIAS",
  "TRIBE",
  "TRIO",
  "TRIP",
  "TRIVI",
  "TRIX",
  "TRN",
  "TROG",
  "TROLL",
  "TROLLGE",
  "TROLLICTO",
  "TRONPAD",
  "TROVE",
  "TROY",
  "TRR",
  "TRST",
  "TRU",
  "TRUEX",
  "TRUF",
  "TRUMP",
  "TRUMPIUS",
  "TRUNK",
  "TRUST",
  "TRUTH",
  "TRUU",
  "TRV",
  "TRVL",
  "TRWA",
  "TRX",
  "TRYC",
  "TSAT",
  "TSEM",
  "TSEMON",
  "TSLA",
  "TSLAB",
  "TSLAON",
  "TSLAX",
  "TSM",
  "TSMB",
  "TSMON",
  "TSMX",
  "TSPACEX",
  "TST",
  "TSTBSC",
  "TSTON",
  "TSUKA",
  "TT",
  "TTAJ",
  "TTC",
  "TTD",
  "TTM",
  "TTMI",
  "TTN",
  "TTON",
  "TTWO",
  "TU",
  "TUA",
  "TULIP",
  "TUNA",
  "TUNE",
  "TUP",
  "TURBO",
  "TURBOS",
  "TURT",
  "TURTLE",
  "TUSD",
  "TUT",
  "TUZKI",
  "TVK",
  "TWC",
  "TWD",
  "TWELVE",
  "TWIGGY",
  "TWLO",
  "TWT",
  "TX",
  "TXC",
  "TXL",
  "TXN",
  "TXNON",
  "TYBG",
  "TYCOON",
  "TYPE",
  "TYPUS",
  "TYT",
  "TZA",
  "U",
  "U2U",
  "UAHG",
  "UAI",
  "UAMYON",
  "UB",
  "UBE",
  "UBER",
  "UBERON",
  "UBERX",
  "UBEX",
  "UBI",
  "UBIT",
  "UBT",
  "UBTC",
  "UBU",
  "UBX",
  "UBXS",
  "UCASH",
  "UCJL",
  "UCN",
  "UCON",
  "UCTTON",
  "UCX",
  "UDAO",
  "UDS",
  "UECON",
  "UFC",
  "UFD",
  "UFI",
  "UFO",
  "UFR",
  "UGO",
  "UGOLD",
  "ULT",
  "ULTI",
  "ULTIMA",
  "ULX",
  "UMA",
  "UMAMI",
  "UMB",
  "UMBRA",
  "UMCON",
  "UMM",
  "UMXM",
  "UMY",
  "UNA",
  "UNCN",
  "UNCX",
  "UNDEAD",
  "UNFI",
  "UNFIDOWN",
  "UNFIUP",
  "UNFK",
  "UNGON",
  "UNH",
  "UNHON",
  "UNHX",
  "UNI",
  "UNIBOT",
  "UNIBTC",
  "UNIC",
  "UNICORN",
  "UNIETH",
  "UNIFY",
  "UNIO",
  "UNION",
  "UNIT",
  "UNIT0",
  "UNITREEAI",
  "UNITS",
  "UNKOWN",
  "UNLEASH",
  "UNMD",
  "UNN",
  "UNO",
  "UNP",
  "UNPON",
  "UNS",
  "UNSHETH",
  "UNT",
  "UNW",
  "UOS",
  "UP",
  "UPC",
  "UPDOG",
  "UPEG",
  "UPI",
  "UPS",
  "UPT",
  "UPTOP",
  "UQC",
  "URA",
  "URANUS",
  "URAON",
  "URNM",
  "URNMON",
  "URO",
  "US",
  "USA",
  "USAD",
  "USAR",
  "USARON",
  "USAT",
  "USCR",
  "USD",
  "USD+",
  "USD.C",
  "USD.F",
  "USD.T",
  "USD0",
  "USD1",
  "USDA",
  "USDAI",
  "USDB",
  "USDBC",
  "USDC",
  "USDC(WORMHOLE)",
  "USDC+",
  "USDC.A",
  "USDC.E",
  "USDCASH",
  "USDCAT",
  "USDCV",
  "USDCX",
  "USDD",
  "USDDD",
  "USDE",
  "USDF",
  "USDG",
  "USDGLO",
  "USDGO",
  "USDH",
  "USDHL",
  "USDI",
  "USDK",
  "USDKG",
  "USDL",
  "USDM",
  "USDN",
  "USDO",
  "USDON",
  "USDP",
  "USDPT",
  "USDQ",
  "USDR",
  "USDS",
  "USDSUI",
  "USDT",
  "USDT.C",
  "USDT.E",
  "USDT0",
  "USDTB",
  "USDTR",
  "USDTZ",
  "USDU",
  "USDUC",
  "USDUT",
  "USDV",
  "USDX",
  "USDY",
  "USDZ",
  "USEDCAR",
  "USELESS",
  "USFRON",
  "USO",
  "USOON",
  "USOR",
  "USP",
  "USPEPE",
  "USR",
  "USSD",
  "UST",
  "USTC",
  "USUAL",
  "USX",
  "UT",
  "UTHR",
  "UTHX",
  "UTK",
  "UTOPIA",
  "UTT",
  "UTYA",
  "UTYAB",
  "UUSD",
  "UVT",
  "UVXY",
  "UW3S",
  "UWU",
  "UX",
  "UXD",
  "UXLINK",
  "UZDT",
  "UZX",
  "V",
  "VAAVE",
  "VADER",
  "VAI",
  "VAIX",
  "VAL",
  "VALAN",
  "VALENTINE",
  "VALOR",
  "VAM",
  "VANA",
  "VANCE",
  "VANKEDISI",
  "VANRY",
  "VANTA",
  "VAPE",
  "VARA",
  "VASCO",
  "VATRENI",
  "VBCH",
  "VBETH",
  "VBG",
  "VBNB",
  "VBNT",
  "VBSWAP",
  "VBTC",
  "VBUSD",
  "VBUSDC",
  "VBUSDT",
  "VBWBTC",
  "VC",
  "VCAKE",
  "VCAT",
  "VCF",
  "VCG",
  "VCHF",
  "VCITY",
  "VCNT",
  "VD",
  "VDAI",
  "VDEON",
  "VDOGE",
  "VDOT",
  "VDR",
  "VEC2",
  "VEE",
  "VELO",
  "VELT",
  "VELVET",
  "VEMP",
  "VENOM",
  "VEREM",
  "VERI",
  "VERONA",
  "VERSE",
  "VERT",
  "VERTAI",
  "VES",
  "VEST",
  "VET",
  "VETH",
  "VEUR",
  "VEX",
  "VFIL",
  "VFSON",
  "VFX",
  "VFY",
  "VGBP",
  "VGX",
  "VIA",
  "VIBE",
  "VIC",
  "VICPAY",
  "VICRON",
  "VICS",
  "VIDZ",
  "VIN",
  "VINE",
  "VINU",
  "VIRGO",
  "VIRL",
  "VIRTU",
  "VIRTUAL",
  "VISTA",
  "VIT",
  "VITA",
  "VK",
  "VLINK",
  "VLR",
  "VLT",
  "VLTC",
  "VLTX",
  "VLX",
  "VMC",
  "VNO",
  "VNQON",
  "VNTR",
  "VNXAU",
  "VOLT",
  "VOLTX",
  "VOLTZ",
  "VON",
  "VONSPEED",
  "VOOI",
  "VOOX",
  "VOPO",
  "VOW",
  "VOXEL",
  "VPAD",
  "VPAY",
  "VPND",
  "VPP",
  "VPR",
  "VR",
  "VRA",
  "VRSC",
  "VRSNON",
  "VRT",
  "VRTON",
  "VRTX",
  "VRTXON",
  "VSG",
  "VSN",
  "VSTON",
  "VSUI",
  "VSX",
  "VSXP",
  "VSYS",
  "VT",
  "VTC",
  "VTHO",
  "VTION",
  "VTIX",
  "VTRX",
  "VTUSD",
  "VTVON",
  "VTX",
  "VU",
  "VULT",
  "VUNI",
  "VUSDC",
  "VUSDT",
  "VVAIFU",
  "VVS",
  "VVV",
  "VX",
  "VXRP",
  "VXT",
  "VXVS",
  "VYFI",
  "VZON",
  "W",
  "W$C",
  "W3S",
  "WAAC",
  "WAD",
  "WADA",
  "WADZ",
  "WAG",
  "WAGMI",
  "WAGMIGAMES",
  "WAI",
  "WAIT",
  "WAL",
  "WALLET",
  "WALLI",
  "WALTER",
  "WALV",
  "WAM",
  "WAMPL",
  "WAN",
  "WANA",
  "WAP",
  "WAPTM",
  "WAR",
  "WARD",
  "WARPED",
  "WARS",
  "WASSIE",
  "WAT",
  "WATCH",
  "WATT",
  "WAVAX",
  "WAVES",
  "WAWA",
  "WAX",
  "WAXL",
  "WAXP",
  "WBAI",
  "WBB",
  "WBCOIN",
  "WBERA",
  "WBESC",
  "WBETH",
  "WBNB",
  "WBRL",
  "WBS",
  "WBT",
  "WBTC",
  "WBULL",
  "WBX",
  "WCDOGE",
  "WCFG",
  "WCFX",
  "WCHZ",
  "WCO",
  "WCORE",
  "WCRO",
  "WCS",
  "WCT",
  "WDC",
  "WDCB",
  "WDCON",
  "WDOG",
  "WDOGE",
  "WE",
  "WEALTH",
  "WEAR",
  "WEB3",
  "WEB4",
  "WECAN",
  "WEETH",
  "WEFI",
  "WEGLD",
  "WEIRDO",
  "WELF",
  "WELL",
  "WEMIX",
  "WEN",
  "WEPE",
  "WERC",
  "WET",
  "WETH",
  "WEVER",
  "WEX",
  "WEXO",
  "WFCON",
  "WFI",
  "WFLR",
  "WFRAX",
  "WFTM",
  "WGR",
  "WHACKD",
  "WHALE",
  "WHALES",
  "WHBAR",
  "WHISKEY",
  "WHITE",
  "WHITEWHALE",
  "WHOREN",
  "WHY",
  "WHYPE",
  "WIF",
  "WIFE",
  "WIFEDOGE",
  "WIFI",
  "WIGL",
  "WIKEN",
  "WILC",
  "WILD",
  "WIN",
  "WING",
  "WINGS",
  "WINR",
  "WINTER",
  "WIOTX",
  "WIRE",
  "WISE",
  "WIT",
  "WITCH",
  "WIZARD",
  "WJXN",
  "WKAS",
  "WKAVA",
  "WKC",
  "WKCS",
  "WKD",
  "WKEYDAO",
  "WKROWN",
  "WL",
  "WLD",
  "WLFI",
  "WLKN",
  "WLTH",
  "WLUNA",
  "WLUNC",
  "WM",
  "WMATIC",
  "WMBON",
  "WMC",
  "WMDR",
  "WMEMO",
  "WMM",
  "WMN",
  "WMNT",
  "WMON",
  "WMOXY",
  "WMT",
  "WMTON",
  "WMTX",
  "WNCG",
  "WNDR",
  "WNEAR",
  "WNRG",
  "WNT",
  "WNXM",
  "WOD",
  "WOJ",
  "WOJAK",
  "WOKB",
  "WOLF",
  "WOLFON",
  "WOM",
  "WOMBAT",
  "WONE",
  "WOO",
  "WOOD",
  "WOODOWN",
  "WOOF",
  "WOOLLY",
  "WOOP",
  "WOORI",
  "WOOUP",
  "WOULD",
  "WOW",
  "WOZX",
  "WPAY",
  "WPEAQ",
  "WPKT",
  "WPOKT",
  "WQUIL",
  "WRBTC",
  "WRC",
  "WRON",
  "WRSETH",
  "WRT",
  "WRX",
  "WS",
  "WSB",
  "WSDM",
  "WSEI",
  "WSG",
  "WSHIB",
  "WSHIDO",
  "WSI",
  "WSM",
  "WSOMI",
  "WSOPH",
  "WSPP",
  "WSTETH",
  "WSTUSDT",
  "WTAO",
  "WTEC",
  "WTFO",
  "WTFUEL",
  "WTHETA",
  "WTRX",
  "WUF",
  "WULFON",
  "WUSD",
  "WUSDR",
  "WVTRS",
  "WW3",
  "WWB",
  "WWDOGE",
  "WX",
  "WXDAI",
  "WXDC",
  "WXM",
  "WXPL",
  "WXT",
  "WXTM",
  "WXTZ",
  "WYAC",
  "WYFION",
  "WYNN",
  "WYZ",
  "WZKCRO",
  "WZRA",
  "WZRD",
  "X",
  "X314",
  "X402",
  "X8X",
  "XAG",
  "XAGX",
  "XAH",
  "XAI",
  "XAN",
  "XAU",
  "XAUH",
  "XAUM",
  "XAUT",
  "XAUT0",
  "XAVA",
  "XAVIER",
  "XB",
  "XBC",
  "XBG",
  "XBI",
  "XBLZD",
  "XBO",
  "XBP",
  "XBRAIN",
  "XBT",
  "XBTC",
  "XBTC21",
  "XCAD",
  "XCASH",
  "XCFX",
  "XCH",
  "XCHNG",
  "XCL",
  "XCM",
  "XCN",
  "XCP",
  "XCU",
  "XCV",
  "XCX",
  "XD",
  "XDAG",
  "XDB",
  "XDC",
  "XDN",
  "XDNA",
  "XDOG",
  "XDOGE",
  "XEC",
  "XEF",
  "XEL",
  "XELS",
  "XEM",
  "XEN",
  "XEP",
  "XERA",
  "XERO",
  "XETH",
  "XFC",
  "XFEE",
  "XFI",
  "XFUND",
  "XGP",
  "XGT",
  "XGZ",
  "XHI",
  "XI",
  "XIAOBAI",
  "XIAOMI",
  "XIN",
  "XING",
  "XINGXING",
  "XION",
  "XKR",
  "XL1",
  "XLAB",
  "XLD",
  "XLE",
  "XLEX",
  "XLK",
  "XLM",
  "XMALL",
  "XMD",
  "XMN",
  "XMON",
  "XMONEY",
  "XMR",
  "XMS",
  "XMT",
  "XMW",
  "XMX",
  "XNA",
  "XNET",
  "XNL",
  "XNO",
  "XNPCS",
  "XNT",
  "XNV",
  "XNY",
  "XO",
  "XOGE",
  "XOMON",
  "XOMX",
  "XOXNO",
  "XOXO",
  "XP",
  "XPASS",
  "XPD",
  "XPED",
  "XPGN",
  "XPHX",
  "XPI",
  "XPIN",
  "XPL",
  "XPLA",
  "XPM",
  "XPR",
  "XPRT",
  "XPT",
  "XPTX",
  "XPX",
  "XPY",
  "XQN",
  "XR",
  "XRA",
  "XRACER",
  "XRB",
  "XRD",
  "XROCK",
  "XRP",
  "XRP 2.0",
  "XRP2.0",
  "XRP20",
  "XRPAYNET",
  "XRPC",
  "XRPETF",
  "XRPH",
  "XRPHAI",
  "XRS",
  "XRT",
  "XRUN",
  "XRUNE",
  "XSAT",
  "XSEED",
  "XSGD",
  "XSOL",
  "XSP",
  "XSPA",
  "XSUSHI",
  "XSWAP",
  "XT",
  "XTAG",
  "XTER",
  "XTM",
  "XTN",
  "XTO",
  "XTP",
  "XTT-B20",
  "XTZ",
  "XU3O8",
  "XUSD",
  "XVG",
  "XVM",
  "XVS",
  "XWC",
  "XWG",
  "XWIN",
  "XX",
  "XYM",
  "XYO",
  "XYRO",
  "XYZ",
  "XYZON",
  "XZK",
  "Y8U",
  "YAI",
  "YAK",
  "YALA",
  "YAY",
  "YB",
  "YBDBD",
  "YBNB",
  "YCE",
  "YCT",
  "YDA",
  "YEC",
  "YEE",
  "YEET",
  "YELLOW",
  "YELPE",
  "YES",
  "YETI",
  "YF-DAI",
  "YFI",
  "YFII",
  "YFO",
  "YFSX",
  "YGG",
  "YILONGMA",
  "YLAY",
  "YLDS",
  "YND",
  "YNE",
  "YNETHX",
  "YNG",
  "YNUSDX",
  "YO",
  "YOM",
  "YOOSHI",
  "YOSHI",
  "YU",
  "YUMMY",
  "YURU",
  "YUSD",
  "YYAVAX",
  "YZY",
  "Z",
  "ZACK",
  "ZAMA",
  "ZANO",
  "ZAP",
  "ZARA",
  "ZARO",
  "ZARP",
  "ZBCN",
  "ZBT",
  "ZBU",
  "ZCHF",
  "ZCL",
  "ZCN",
  "ZCX",
  "ZD",
  "ZEC",
  "ZED",
  "ZEDXION",
  "ZEE",
  "ZEFI",
  "ZEN",
  "ZENAI",
  "ZENC",
  "ZENI",
  "ZENIX",
  "ZENT",
  "ZEPH",
  "ZERA",
  "ZERC",
  "ZEREBRO",
  "ZERO",
  "ZEST",
  "ZET",
  "ZETA",
  "ZETACHAIN",
  "ZETRIX",
  "ZEUM",
  "ZEUS",
  "ZEX",
  "ZF",
  "ZFI",
  "ZGC",
  "ZHIPU",
  "ZHOA",
  "ZIB",
  "ZIG",
  "ZIK",
  "ZIL",
  "ZILDOWN",
  "ZILLIONXO",
  "ZILUP",
  "ZINC",
  "ZIOW",
  "ZIPT",
  "ZIX",
  "ZK",
  "ZKC",
  "ZKF",
  "ZKJ",
  "ZKL",
  "ZKML",
  "ZKP",
  "ZKWASM",
  "ZLW",
  "ZM",
  "ZMN",
  "ZND",
  "ZNN",
  "ZNX",
  "ZNZ",
  "ZOO",
  "ZOOM",
  "ZOOMER",
  "ZOON",
  "ZORA",
  "ZPAY",
  "ZRC",
  "ZRO",
  "ZRX",
  "ZSC",
  "ZSWAP",
  "ZTC",
  "ZTH",
  "ZTX",
  "ZUNO",
  "ZUSD",
  "ZUSHI",
  "ZYB",
  "ZYD",
  "ZYLO",
  "ZYN",
  "ZYPTO",
  "\u4E00",
  "\u4E16\u754C\u548C\u5E73",
  "\u4EBA\u751FK\u7EBF",
  "\u4FEE\u4ED9",
  "\u5206\u7EA2\u72D7\u5934",
  "\u5409\u7965\u9A6C",
  "\u54C8\u55BD",
  "\u54C8\u57FA\u7C73",
  "\u54ED\u54ED\u9A6C",
  "\u5B89",
  "\u5BA2\u670D\u5C0F\u4F55",
  "\u5C0F\u874C\u86AA",
  "\u5E01\u5B89\u4EBA\u751F",
  "\u6076\u4FD7\u4F01\u9E45",
  "\u6211\u8E0F\u9A6C\u6765\u4E86",
  "\u65FA\u67F4",
  "\u6B7B\u4E86\u4E48",
  "\u72D7\u72D7\u5E01",
  "\u8001\u5B50",
  "\u8CA1\u52D9\u81EA\u7531",
  "\u8D75\u957F\u5A25",
  "\u8F9B\u666E\u68EE",
  "\u96EA\u7403",
  "\u9ED1\u9A6C",
  "\u9F99\u867E"
];

// src/validation.ts
function isValidSymbol(symbol) {
  return unique_symbols_default.includes(symbol);
}
__name(isValidSymbol, "isValidSymbol");
var MARKETS = ["CoinMarketCap", "CoinBase", "Kucoin"];
function isValidMarket(market) {
  return MARKETS.includes(market);
}
__name(isValidMarket, "isValidMarket");
var PERIODS = ["30m", "1h", "3h", "6h", "12h", "24h"];
function isValidPeriod(value) {
  return PERIODS.includes(value);
}
__name(isValidPeriod, "isValidPeriod");
function getPeriodMilliseconds(period) {
  const periods = {
    "30m": 30 * 60 * 1e3,
    "1h": 60 * 60 * 1e3,
    "3h": 3 * 60 * 60 * 1e3,
    "6h": 6 * 60 * 60 * 1e3,
    "12h": 12 * 60 * 60 * 1e3,
    "24h": 24 * 60 * 60 * 1e3
  };
  return periods[period];
}
__name(getPeriodMilliseconds, "getPeriodMilliseconds");

// src/api.ts
async function getCoinBasePrices() {
  const response = await fetch(
    "https://api.coinbase.com/v2/exchange-rates?currency=USD"
  );
  if (!response.ok) {
    throw new Error("CoinBase API error");
  }
  const data = await response.json();
  const prices = {};
  for (const [symbol, rate] of Object.entries(data.data.rates)) {
    const value = Number(rate);
    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }
    prices[symbol] = 1 / value;
  }
  return prices;
}
__name(getCoinBasePrices, "getCoinBasePrices");
async function getCoinMarketCapPrices(env) {
  if (!env.CMC_API_KEY) {
    throw new Error("CMC_API_KEY is missing");
  }
  const response = await fetch(
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=5000",
    {
      headers: {
        "X-CMC_PRO_API_KEY": env.CMC_API_KEY
      }
    }
  );
  if (!response.ok) {
    console.log(await response.text());
    throw new Error("CoinMarketCap API error");
  }
  const data = await response.json();
  const prices = {};
  for (const coin of data.data) {
    const price = Number(coin.quote.USD.price);
    if (!Number.isFinite(price) || price <= 0) {
      continue;
    }
    if (!prices[coin.symbol]) {
      prices[coin.symbol] = price;
    }
  }
  return prices;
}
__name(getCoinMarketCapPrices, "getCoinMarketCapPrices");
async function getKucoinPrices() {
  const response = await fetch("https://api.kucoin.com/api/v1/prices?base=USD");
  if (!response.ok) {
    throw new Error("Kucoin API error");
  }
  const data = await response.json();
  const prices = {};
  for (const [symbol, price] of Object.entries(data.data)) {
    const value = Number(price);
    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }
    prices[symbol] = value;
  }
  return prices;
}
__name(getKucoinPrices, "getKucoinPrices");
async function sendMessage(env, chatId, text2, replyMarkup) {
  if (!env.TELEGRAM_TOKEN) {
    throw new Error("TELEGRAM_TOKEN is missing");
  }
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text2,
        reply_markup: replyMarkup
      })
    }
  );
  if (!response.ok) {
    throw new Error(`Telegram error: ${await response.text()}`);
  }
  return response.json();
}
__name(sendMessage, "sendMessage");

// src/db/database.ts
function getDb(env) {
  return drizzle(env.crypto_db);
}
__name(getDb, "getDb");
async function getCryptoInfo(env, symbol, startTime, market) {
  const db = getDb(env);
  if (market) {
    const result2 = await db.select().from(CRYPTO_DETAILS).where(
      and(
        eq(CRYPTO_DETAILS.symbol, symbol),
        eq(CRYPTO_DETAILS.market, market),
        gte(CRYPTO_DETAILS.createdTime, startTime)
      )
    ).orderBy(desc(CRYPTO_DETAILS.createdTime));
    return result2;
  }
  const result = await db.select({
    createdTime: sql`
        MAX(${CRYPTO_DETAILS.createdTime})
      `,
    averagePrice: sql`
        AVG(${CRYPTO_DETAILS.price})
      `
  }).from(CRYPTO_DETAILS).where(
    and(
      eq(CRYPTO_DETAILS.symbol, symbol),
      gte(CRYPTO_DETAILS.createdTime, startTime)
    )
  ).groupBy(
    sql`
        CAST(${CRYPTO_DETAILS.createdTime} / 300000 AS INTEGER)
      `
  ).orderBy(
    desc(
      sql`
          MAX(${CRYPTO_DETAILS.createdTime})
        `
    )
  );
  return result.map((item) => ({
    createdTime: Number(item.createdTime),
    averagePrice: Number(item.averagePrice)
  }));
}
__name(getCryptoInfo, "getCryptoInfo");
async function getCryptoHistory(env, symbol, period) {
  const db = getDb(env);
  const startTime = Date.now() - getPeriodMilliseconds(period);
  const result = await db.select({
    createdTime: sql`
        MAX(${CRYPTO_DETAILS.createdTime})
      `,
    averagePrice: sql`
        AVG(${CRYPTO_DETAILS.price})
      `
  }).from(CRYPTO_DETAILS).where(
    and(
      eq(CRYPTO_DETAILS.symbol, symbol),
      gte(CRYPTO_DETAILS.createdTime, startTime)
    )
  ).groupBy(
    sql`
        CAST(${CRYPTO_DETAILS.createdTime} / 300000 AS INTEGER)
      `
  ).orderBy(
    desc(
      sql`
          MAX(${CRYPTO_DETAILS.createdTime})
        `
    )
  );
  return result.map((item) => ({
    createdTime: Number(item.createdTime),
    averagePrice: Number(item.averagePrice)
  }));
}
__name(getCryptoHistory, "getCryptoHistory");
async function updateCryptoPrices(env) {
  const db = getDb(env);
  const results = await Promise.allSettled([
    getCoinBasePrices().then((prices) => ({
      market: "CoinBase",
      prices
    })),
    getCoinMarketCapPrices(env).then((prices) => ({
      market: "CoinMarketCap",
      prices
    })),
    getKucoinPrices().then((prices) => ({
      market: "Kucoin",
      prices
    }))
  ]);
  const rows = [];
  const createdTime = Date.now();
  for (const result of results) {
    if (result.status !== "fulfilled") {
      console.error("Market update failed:", result.reason);
      continue;
    }
    const { market, prices } = result.value;
    for (const [symbol, price] of Object.entries(prices)) {
      rows.push({
        symbol,
        market,
        price,
        createdTime
      });
    }
  }
  if (rows.length === 0) {
    console.log("No cryptocurrency data to save");
    return;
  }
  console.log(`Saving ${rows.length} cryptocurrency prices`);
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db.insert(CRYPTO_DETAILS).values(batch);
    console.log(
      `Saved batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} rows`
    );
  }
  console.log(`Successfully saved ${rows.length} cryptocurrency prices`);
}
__name(updateCryptoPrices, "updateCryptoPrices");
async function addFavourite(env, chatId, symbol) {
  const db = getDb(env);
  const exists2 = await db.select().from(FAVORITES).where(and(eq(FAVORITES.chatId, chatId), eq(FAVORITES.symbol, symbol)));
  if (exists2.length > 0) {
    return;
  }
  await db.insert(FAVORITES).values({
    chatId,
    symbol
  });
}
__name(addFavourite, "addFavourite");
async function deleteFavourite(env, chatId, symbol) {
  const db = getDb(env);
  await db.delete(FAVORITES).where(and(eq(FAVORITES.chatId, chatId), eq(FAVORITES.symbol, symbol)));
}
__name(deleteFavourite, "deleteFavourite");
async function isFavourite(env, chatId, symbol) {
  const db = getDb(env);
  const result = await db.select().from(FAVORITES).where(and(eq(FAVORITES.chatId, chatId), eq(FAVORITES.symbol, symbol)));
  return result.length > 0;
}
__name(isFavourite, "isFavourite");
async function getFavourite(env, chatId) {
  const db = getDb(env);
  return db.select().from(FAVORITES).where(eq(FAVORITES.chatId, chatId));
}
__name(getFavourite, "getFavourite");
async function getRecentCrypto(env) {
  const db = getDb(env);
  const startTime = Date.now() - 24 * 60 * 60 * 1e3;
  const result = await db.select({
    symbol: CRYPTO_DETAILS.symbol,
    averagePrice: sql`
        AVG(${CRYPTO_DETAILS.price})
      `
  }).from(CRYPTO_DETAILS).where(gte(CRYPTO_DETAILS.createdTime, startTime)).groupBy(CRYPTO_DETAILS.symbol).orderBy(
    desc(
      sql`
          MAX(${CRYPTO_DETAILS.createdTime})
        `
    )
  ).limit(20);
  return result.map((coin) => ({
    symbol: coin.symbol,
    price: Number(coin.averagePrice)
  }));
}
__name(getRecentCrypto, "getRecentCrypto");

// src/bot.ts
var bot = new Hono2();
bot.post("/webhook", async (c) => {
  console.log("WEBHOOK RECEIVED");
  const update = await c.req.json();
  console.log("UPDATE:", update);
  if (update.callback_query) {
    const callback = update.callback_query;
    const chatId2 = callback.message?.chat?.id;
    const data = callback.data || "";
    if (!chatId2) {
      return c.text("OK");
    }
    if (data.startsWith("add_")) {
      const symbol = data.replace("add_", "").toUpperCase();
      if (!isValidSymbol(symbol)) {
        await sendMessage(c.env, chatId2, `Unknown cryptocurrency: ${symbol}`);
        return c.text("OK");
      }
      await addFavourite(c.env, chatId2, symbol);
      await sendMessage(c.env, chatId2, `${symbol} added to favourites`);
      return c.text("OK");
    }
    if (data.startsWith("delete_")) {
      const symbol = data.replace("delete_", "").toUpperCase();
      await deleteFavourite(c.env, chatId2, symbol);
      await sendMessage(c.env, chatId2, `${symbol} removed from favourites`);
      return c.text("OK");
    }
    if (data.startsWith("period_")) {
      const parts = data.split("_");
      const symbol = parts[1]?.toUpperCase();
      const period = parts[2];
      if (!symbol || !period) {
        return c.text("OK");
      }
      if (!isValidSymbol(symbol)) {
        await sendMessage(c.env, chatId2, `Unknown cryptocurrency: ${symbol}`);
        return c.text("OK");
      }
      if (!isValidPeriod(period)) {
        await sendMessage(c.env, chatId2, "Invalid period.");
        return c.text("OK");
      }
      const history = await getCryptoHistory(c.env, symbol, period);
      if (history.length === 0) {
        await sendMessage(
          c.env,
          chatId2,
          `No data found for ${symbol} for the last ${period}.`
        );
        return c.text("OK");
      }
      const historyText = history.map(
        (item) => `${new Date(item.createdTime).toISOString()} \u2014 $${item.averagePrice.toFixed(2)}`
      ).join("\n");
      const favourite = await isFavourite(c.env, chatId2, symbol);
      await sendMessage(
        c.env,
        chatId2,
        `${symbol}

Average price history for the last ${period}:

${historyText}`,
        {
          inline_keyboard: [
            [
              {
                text: favourite ? "Remove from following" : "Add to following",
                callback_data: favourite ? `delete_${symbol}` : `add_${symbol}`
              }
            ]
          ]
        }
      );
      return c.text("OK");
    }
    return c.text("OK");
  }
  const message = update.message;
  if (!message) {
    return c.text("OK");
  }
  const chatId = message.chat?.id;
  const text2 = message.text || "";
  if (!chatId) {
    return c.text("OK");
  }
  if (text2 === "/start") {
    await sendMessage(
      c.env,
      chatId,
      `Welcome to Crypto Bot.

Use /help to see available commands.`
    );
  } else if (text2 === "/help") {
    await sendMessage(
      c.env,
      chatId,
      `Commands:

/listRecent
/listFavourite
/addToFavourite BTC
/deleteFavourite BTC

You can also request a cryptocurrency:

/BTC
/ETH
/SOL`
    );
  } else if (text2.startsWith("/addToFavourite")) {
    const symbol = text2.split(/\s+/)[1]?.toUpperCase();
    if (!symbol) {
      await sendMessage(
        c.env,
        chatId,
        "Symbol required.\n\nExample: /addToFavourite BTC"
      );
      return c.text("OK");
    }
    if (!isValidSymbol(symbol)) {
      await sendMessage(c.env, chatId, `Unknown cryptocurrency: ${symbol}`);
      return c.text("OK");
    }
    await addFavourite(c.env, chatId, symbol);
    await sendMessage(c.env, chatId, `${symbol} added to favourites`);
  } else if (text2.startsWith("/deleteFavourite")) {
    const symbol = text2.split(/\s+/)[1]?.toUpperCase();
    if (!symbol) {
      await sendMessage(
        c.env,
        chatId,
        "Symbol required.\n\nExample: /deleteFavourite BTC"
      );
      return c.text("OK");
    }
    await deleteFavourite(c.env, chatId, symbol);
    await sendMessage(c.env, chatId, `${symbol} removed from favourites`);
  } else if (text2 === "/listFavourite") {
    const coins = await getFavourite(c.env, chatId);
    if (coins.length === 0) {
      await sendMessage(c.env, chatId, "Your favourites list is empty.");
      return c.text("OK");
    }
    const result = coins.map((coin) => `/${coin.symbol}`).join("\n");
    await sendMessage(c.env, chatId, result);
  } else if (text2 === "/listRecent") {
    const coins = await getRecentCrypto(c.env);
    if (coins.length === 0) {
      await sendMessage(c.env, chatId, "No cryptocurrency data available.");
      return c.text("OK");
    }
    const result = coins.map((coin) => `/${coin.symbol} $${coin.price.toFixed(2)}`).join("\n");
    await sendMessage(c.env, chatId, result);
  } else if (/^\/[a-zA-Z0-9]+$/.test(text2)) {
    const symbol = text2.substring(1).toUpperCase();
    if (!isValidSymbol(symbol)) {
      await sendMessage(c.env, chatId, `Unknown cryptocurrency: ${symbol}`);
      return c.text("OK");
    }
    const favourite = await isFavourite(c.env, chatId, symbol);
    await sendMessage(
      c.env,
      chatId,
      `${symbol}

Choose period:`,
      {
        inline_keyboard: [
          [
            {
              text: "30m",
              callback_data: `period_${symbol}_30m`
            },
            {
              text: "1h",
              callback_data: `period_${symbol}_1h`
            }
          ],
          [
            {
              text: "3h",
              callback_data: `period_${symbol}_3h`
            },
            {
              text: "6h",
              callback_data: `period_${symbol}_6h`
            }
          ],
          [
            {
              text: "12h",
              callback_data: `period_${symbol}_12h`
            },
            {
              text: "24h",
              callback_data: `period_${symbol}_24h`
            }
          ],
          [
            {
              text: favourite ? "Remove from following" : "Add to following",
              callback_data: favourite ? `delete_${symbol}` : `add_${symbol}`
            }
          ]
        ]
      }
    );
  }
  return c.text("OK");
});
var bot_default = bot;

// src/index.ts
var app = new Hono2();
app.use("*", cors());
app.get("/crypto", async (c) => {
  const symbol = c.req.query("symbol");
  const market = c.req.query("market");
  const startTime = c.req.query("startTime");
  if (!symbol || !isValidSymbol(symbol)) {
    return c.json(
      {
        error: "Unknown cryptocurrency"
      },
      400
    );
  }
  if (market) {
    if (!isValidMarket(market)) {
      return c.json(
        {
          error: "Unknown market"
        },
        400
      );
    }
    const marketSymbolsMap = {
      CoinBase: coinbase_symbols_default,
      CoinMarketCap: cmc_symbols_default,
      Kucoin: kucoin_symbols_default
    };
    if (!marketSymbolsMap[market]?.includes(symbol.toUpperCase())) {
      return c.json(
        {
          error: "Symbol not available on this market"
        },
        400
      );
    }
  }
  if (!startTime) {
    return c.json(
      {
        error: "startTime is required"
      },
      400
    );
  }
  const startTimeNumber = Number(startTime);
  if (Number.isNaN(startTimeNumber)) {
    return c.json(
      {
        error: "startTime must be milliseconds"
      },
      400
    );
  }
  const data = await getCryptoInfo(
    c.env,
    symbol,
    startTimeNumber,
    market
  );
  return c.json(data);
});
app.route("/telegram", bot_default);
var index_default = {
  fetch: app.fetch,
  async scheduled(_controller, env, _ctx) {
    console.log("Updating cryptocurrency prices");
    try {
      await updateCryptoPrices(env);
      console.log("Update completed");
    } catch (error) {
      console.error("Update failed:", error);
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
