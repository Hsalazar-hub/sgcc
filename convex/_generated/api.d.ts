/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as api_ from "../api.js";
import type * as clerk from "../clerk.js";
import type * as corredores from "../corredores.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as http from "../http.js";
import type * as polizas from "../polizas.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  api: typeof api_;
  clerk: typeof clerk;
  corredores: typeof corredores;
  crons: typeof crons;
  email: typeof email;
  http: typeof http;
  polizas: typeof polizas;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
