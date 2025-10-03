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
import type * as functions_admin from "../functions/admin.js";
import type * as functions_amentities from "../functions/amentities.js";
import type * as functions_chat from "../functions/chat.js";
import type * as functions_dorms from "../functions/dorms.js";
import type * as functions_email from "../functions/email.js";
import type * as functions_expenses from "../functions/expenses.js";
import type * as functions_invoices from "../functions/invoices.js";
import type * as functions_notifications from "../functions/notifications.js";
import type * as functions_payments from "../functions/payments.js";
import type * as functions_renters from "../functions/renters.js";
import type * as functions_rooms from "../functions/rooms.js";
import type * as functions_subscriptions from "../functions/subscriptions.js";
import type * as functions_sync from "../functions/sync.js";
import type * as functions_syncAmenities from "../functions/syncAmenities.js";
import type * as functions_users from "../functions/users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "functions/admin": typeof functions_admin;
  "functions/amentities": typeof functions_amentities;
  "functions/chat": typeof functions_chat;
  "functions/dorms": typeof functions_dorms;
  "functions/email": typeof functions_email;
  "functions/expenses": typeof functions_expenses;
  "functions/invoices": typeof functions_invoices;
  "functions/notifications": typeof functions_notifications;
  "functions/payments": typeof functions_payments;
  "functions/renters": typeof functions_renters;
  "functions/rooms": typeof functions_rooms;
  "functions/subscriptions": typeof functions_subscriptions;
  "functions/sync": typeof functions_sync;
  "functions/syncAmenities": typeof functions_syncAmenities;
  "functions/users": typeof functions_users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
