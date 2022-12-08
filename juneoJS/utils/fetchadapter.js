"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAdapter = void 0;
function createRequest(config) {
    const headers = new Headers(config.headers);
    if (config.auth) {
        const username = config.auth.username || "";
        const password = config.auth.password
            ? encodeURIComponent(config.auth.password)
            : "";
        headers.set("Authorization", `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`);
    }
    const method = config.method.toUpperCase();
    const options = {
        headers: headers,
        method
    };
    if (method !== "GET" && method !== "HEAD") {
        options.body = config.data;
    }
    if (!!config.withCredentials) {
        options.credentials = config.withCredentials ? "include" : "omit";
    }
    const fullPath = new URL(config.url, config.baseURL);
    const params = new URLSearchParams(config.params);
    const url = `${fullPath}${params}`;
    return new Request(url, options);
}
function getResponse(request, config) {
    return __awaiter(this, void 0, void 0, function* () {
        let stageOne;
        try {
            stageOne = yield fetch(request);
        }
        catch (e) {
            const error = Object.assign(Object.assign({}, new Error("Network Error")), { config,
                request, isAxiosError: true, toJSON: () => error });
            return Promise.reject(error);
        }
        const response = {
            status: stageOne.status,
            statusText: stageOne.statusText,
            headers: Object.assign({}, stageOne.headers),
            config: config,
            request,
            data: undefined // we set it below
        };
        if (stageOne.status >= 200 && stageOne.status !== 204) {
            switch (config.responseType) {
                case "arraybuffer":
                    response.data = yield stageOne.arrayBuffer();
                    break;
                case "blob":
                    response.data = yield stageOne.blob();
                    break;
                case "json":
                    response.data = yield stageOne.json();
                    break;
                case "formData":
                    response.data = yield stageOne.formData();
                    break;
                default:
                    response.data = yield stageOne.text();
                    break;
            }
        }
        return Promise.resolve(response);
    });
}
function fetchAdapter(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = createRequest(config);
        const promiseChain = [getResponse(request, config)];
        if (config.timeout && config.timeout > 0) {
            promiseChain.push(new Promise((res, reject) => {
                setTimeout(() => {
                    const message = config.timeoutErrorMessage
                        ? config.timeoutErrorMessage
                        : "timeout of " + config.timeout + "ms exceeded";
                    const error = Object.assign(Object.assign({}, new Error(message)), { config,
                        request, code: "ECONNABORTED", isAxiosError: true, toJSON: () => error });
                    reject(error);
                }, config.timeout);
            }));
        }
        const response = yield Promise.race(promiseChain);
        return new Promise((resolve, reject) => {
            if (response instanceof Error) {
                reject(response);
            }
            else {
                if (!response.status ||
                    !response.config.validateStatus ||
                    response.config.validateStatus(response.status)) {
                    resolve(response);
                }
                else {
                    const error = Object.assign(Object.assign({}, new Error("Request failed with status code " + response.status)), { config,
                        request, code: response.status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST", isAxiosError: true, toJSON: () => error });
                    reject(error);
                }
            }
        });
    });
}
exports.fetchAdapter = fetchAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmV0Y2hhZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL2ZldGNoYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFFQSxTQUFTLGFBQWEsQ0FBQyxNQUEwQjtJQUMvQyxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBaUMsQ0FBQyxDQUFBO0lBRXJFLElBQUksTUFBTSxDQUFDLElBQUksRUFBRTtRQUNmLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQTtRQUMzQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVE7WUFDbkMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQzFDLENBQUMsQ0FBQyxFQUFFLENBQUE7UUFDTixPQUFPLENBQUMsR0FBRyxDQUNULGVBQWUsRUFDZixTQUFTLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FDckUsQ0FBQTtLQUNGO0lBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUMxQyxNQUFNLE9BQU8sR0FBZ0I7UUFDM0IsT0FBTyxFQUFFLE9BQU87UUFDaEIsTUFBTTtLQUNQLENBQUE7SUFDRCxJQUFJLE1BQU0sS0FBSyxLQUFLLElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRTtRQUN6QyxPQUFPLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUE7S0FDM0I7SUFFRCxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFO1FBQzVCLE9BQU8sQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMs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TSxDQUFDLEtBQUssQ0FBQyxDQUFBO2lCQUNkO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7Q0FBQTtBQXBERCxvQ0FvREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBeGlvc1JlcXVlc3RDb25maWcsIEF4aW9zUmVzcG9uc2UsIEF4aW9zRXJyb3IgfSBmcm9tIFwiYXhpb3NcIlxyXG5cclxuZnVuY3Rpb24gY3JlYXRlUmVxdWVzdChjb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZyk6IFJlcXVlc3Qge1xyXG4gIGNvbnN0IGhlYWRlcnMgPSBuZXcgSGVhZGVycyhjb25maWcuaGVhZGVycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVxyXG5cclxuICBpZiAoY29uZmlnLmF1dGgpIHtcclxuICAgIGNvbnN0IHVzZXJuYW1lID0gY29uZmlnLmF1dGgudXNlcm5hbWUgfHwgXCJcIlxyXG4gICAgY29uc3QgcGFzc3dvcmQgPSBjb25maWcuYXV0aC5wYXNzd29yZFxyXG4gICAgICA/IGVuY29kZVVSSUNvbXBvbmVudChjb25maWcuYXV0aC5wYXNzd29yZClcclxuICAgICAgOiBcIlwiXHJcbiAgICBoZWFkZXJzLnNldChcclxuICAgICAgXCJBdXRob3JpemF0aW9uXCIsXHJcbiAgICAgIGBCYXNpYyAke0J1ZmZlci5mcm9tKGAke3VzZXJuYW1lfToke3Bhc3N3b3JkfWApLnRvU3RyaW5nKFwiYmFzZTY0XCIpfWBcclxuICAgIClcclxuICB9XHJcblxyXG4gIGNvbnN0IG1ldGhvZCA9IGNvbmZpZy5tZXRob2QudG9VcHBlckNhc2UoKVxyXG4gIGNvbnN0IG9wdGlvbnM6IFJlcXVlc3RJbml0ID0ge1xyXG4gICAgaGVhZGVyczogaGVhZGVycyxcclxuICAgIG1ldGhvZFxyXG4gIH1cclxuICBpZiAobWV0aG9kICE9PSBcIkdFVFwiICYmIG1ldGhvZCAhPT0gXCJIRUFEXCIpIHtcclxuICAgIG9wdGlvbnMuYm9keSA9IGNvbmZpZy5kYXRhXHJcbiAgfVxyXG5cclxuICBpZiAoISFjb25maWcud2l0aENyZWRlbnRpYWxzKSB7XHJcbiAgICBvcHRpb25zLmNyZWRlbnRpYWxzID0gY29uZmlnLndpdGhDcmVkZW50aWFscyA/IFwiaW5jbHVkZVwiIDogXCJvbWl0XCJcclxuICB9XHJcblxyXG4gIGNvbnN0IGZ1bGxQYXRoID0gbmV3IFVSTChjb25maWcudXJsLCBjb25maWcuYmFzZVVSTClcclxuICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGNvbmZpZy5wYXJhbXMpXHJcblxyXG4gIGNvbnN0IHVybCA9IGAke2Z1bGxQYXRofSR7cGFyYW1zfWBcclxuXHJcbiAgcmV0dXJuIG5ldyBSZXF1ZXN0KHVybCwgb3B0aW9ucylcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0UmVzcG9uc2UocmVxdWVzdCwgY29uZmlnKTogUHJvbWlzZTxBeGlvc1Jlc3BvbnNlPiB7XHJcbiAgbGV0IHN0YWdlT25lXHJcbiAgdHJ5IHtcclxuICAgIHN0YWdlT25lID0gYXdhaXQgZmV0Y2gocmVxdWVzdClcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBjb25zdCBlcnJvcjogQXhpb3NFcnJvciA9IHtcclxuICAgICAgLi4ubmV3IEVycm9yKFwiTmV0d29yayBFcnJvclwiKSxcclxuICAgICAgY29uZmlnLFxyXG4gICAgICByZXF1ZXN0LFxyXG4gICAgICBpc0F4aW9zRXJyb3I6IHRydWUsXHJcbiAgICAgIHRvSlNPTjogKCkgPT4gZXJyb3JcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcilcclxuICB9XHJcblxyXG4gIGNvbnN0IHJlc3BvbnNlOiBBeGlvc1Jlc3BvbnNlID0ge1xyXG4gICAgc3RhdHVzOiBzdGFnZU9uZS5zdGF0dXMsXHJcbiAgICBzdGF0dXNUZXh0OiBzdGFnZU9uZS5zdGF0dXNUZXh0LFxyXG4gICAgaGVhZGVyczogeyAuLi5zdGFnZU9uZS5oZWFkZXJzIH0sIC8vIG1ha2UgYSBjb3B5IG9mIHRoZSBoZWFkZXJzXHJcbiAgICBjb25maWc6IGNvbmZpZyxcclxuICAgIHJlcXVlc3QsXHJcbiAgICBkYXRhOiB1bmRlZmluZWQgLy8gd2Ugc2V0IGl0IGJlbG93XHJcbiAgfVxyXG5cclxuICBpZiAoc3RhZ2VPbmUuc3RhdHVzID49IDIwMCAmJiBzdGFnZU9uZS5zdGF0dXMgIT09IDIwNCkge1xyXG4gICAgc3dpdGNoIChjb25maWcucmVzcG9uc2VUeXBlKSB7XHJcbiAgICAgIGNhc2UgXCJhcnJheWJ1ZmZlclwiOlxyXG4gICAgICAgIHJlc3BvbnNlLmRhdGEgPSBhd2FpdCBzdGFnZU9uZS5hcnJheUJ1ZmZlcigpXHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgY2FzZSBcImJsb2JcIjpcclxuICAgICAgICByZXNwb25zZS5kYXRhID0gYXdhaXQgc3RhZ2VPbmUuYmxvYigpXHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgY2FzZSBcImpzb25cIjpcclxuICAgICAgICByZXNwb25zZS5kYXRhID0gYXdhaXQgc3RhZ2VPbmUuanNvbigpXHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgY2FzZSBcImZvcm1EYXRhXCI6XHJcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGF3YWl0IHN0YWdlT25lLmZvcm1EYXRhKClcclxuICAgICAgICBicmVha1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJlc3BvbnNlLmRhdGEgPSBhd2FpdCBzdGFnZU9uZS50ZXh0KClcclxuICAgICAgICBicmVha1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXNwb25zZSlcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoQWRhcHRlcihcclxuICBjb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZ1xyXG4pOiBQcm9taXNlPEF4aW9zUmVzcG9uc2U+IHtcclxuICBjb25zdCByZXF1ZXN0ID0gY3JlYXRlUmVxdWVzdChjb25maWcpXHJcblxyXG4gIGNvbnN0IHByb21pc2VDaGFpbiA9IFtnZXRSZXNwb25zZShyZXF1ZXN0LCBjb25maWcpXVxyXG5cclxuICBpZiAoY29uZmlnLnRpbWVvdXQgJiYgY29uZmlnLnRpbWVvdXQgPiAwKSB7XHJcbiAgICBwcm9taXNlQ2hhaW4ucHVzaChcclxuICAgICAgbmV3IFByb21pc2UoKHJlcywgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBtZXNzYWdlID0gY29uZmlnLnRpbWVvdXRFcnJvck1lc3NhZ2VcclxuICAgICAgICAgICAgPyBjb25maWcudGltZW91dEVycm9yTWVzc2FnZVxyXG4gICAgICAgICAgICA6IFwidGltZW91dCBvZiBcIiArIGNvbmZpZy50aW1lb3V0ICsgXCJtcyBleGNlZWRlZFwiXHJcbiAgICAgICAgICBjb25zdCBlcnJvcjogQXhpb3NFcnJvciA9IHtcclxuICAgICAgICAgICAgLi4ubmV3IEVycm9yKG1lc3NhZ2UpLFxyXG4gICAgICAgICAgICBjb25maWcsXHJcbiAgICAgICAgICAgIHJlcXVlc3QsXHJcbiAgICAgICAgICAgIGNvZGU6IFwiRUNPTk5BQk9SVEVEXCIsXHJcbiAgICAgICAgICAgIGlzQXhpb3NFcnJvcjogdHJ1ZSxcclxuICAgICAgICAgICAgdG9KU09OOiAoKSA9PiBlcnJvclxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmVqZWN0KGVycm9yKVxyXG4gICAgICAgIH0sIGNvbmZpZy50aW1lb3V0KVxyXG4gICAgICB9KVxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBQcm9taXNlLnJhY2UocHJvbWlzZUNoYWluKVxyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBpZiAocmVzcG9uc2UgaW5zdGFuY2VvZiBFcnJvcikge1xyXG4gICAgICByZWplY3QocmVzcG9uc2UpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgIXJlc3BvbnNlLnN0YXR1cyB8fFxyXG4gICAgICAgICFyZXNwb25zZS5jb25maWcudmFsaWRhdGVTdGF0dXMgfHxcclxuICAgICAgICByZXNwb25zZS5jb25maWcudmFsaWRhdGVTdGF0dXMocmVzcG9uc2Uuc3RhdHVzKVxyXG4gICAgICApIHtcclxuICAgICAgICByZXNvbHZlKHJlc3BvbnNlKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IGVycm9yOiBBeGlvc0Vycm9yID0ge1xyXG4gICAgICAgICAgLi4ubmV3IEVycm9yKFwiUmVxdWVzdCBmYWlsZWQgd2l0aCBzdGF0dXMgY29kZSBcIiArIHJlc3BvbnNlLnN0YXR1cyksXHJcbiAgICAgICAgICBjb25maWcsXHJcbiAgICAgICAgICByZXF1ZXN0LFxyXG4gICAgICAgICAgY29kZTogcmVzcG9uc2Uuc3RhdHVzID49IDUwMCA/IFwiRVJSX0JBRF9SRVNQT05TRVwiIDogXCJFUlJfQkFEX1JFUVVFU1RcIixcclxuICAgICAgICAgIGlzQXhpb3NFcnJvcjogdHJ1ZSxcclxuICAgICAgICAgIHRvSlNPTjogKCkgPT4gZXJyb3JcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVqZWN0KGVycm9yKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSlcclxufVxyXG4iXX0=