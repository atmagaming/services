import type { EventHandler, EventHandlerRequest, H3Event } from "h3";
import { defineEventHandler, getRouterParam, getValidatedQuery, readValidatedBody } from "h3";
import type { SessionUser } from "services/auth";
import { type ZodType, z } from "zod";

type SchemaInput = Record<string, ZodType>;
type Schemas = { body?: SchemaInput; query?: SchemaInput };

type InferSchema<S extends SchemaInput> = S extends ZodType
  ? z.infer<S>
  : { [K in keyof S]: S[K] extends ZodType ? z.infer<S[K]> : never };

type Inferred<S extends Schemas> = { [K in keyof S]: S[K] extends SchemaInput ? InferSchema<S[K]> : never };

type BaseContext = { event: H3Event; user: SessionUser | null; router: Record<string, string> };

const routerProxy = (event: H3Event) =>
  new Proxy({} as Record<string, string>, { get: (_, key: string) => getRouterParam(event, key) });

export function handler<S extends Schemas, R>(
  schemas: S,
  fn: (context: Inferred<S> & BaseContext) => R,
): EventHandler<EventHandlerRequest, R>;
export function handler<R>(fn: (context: BaseContext) => R): EventHandler<EventHandlerRequest, R>;
export function handler<S extends Schemas>(
  schemasOrFn: S | ((context: BaseContext) => unknown),
  fn?: (context: Inferred<S> & BaseContext) => unknown,
) {
  if (typeof schemasOrFn === "function")
    return defineEventHandler(async (event) =>
      schemasOrFn({ event, user: event.context.user, router: routerProxy(event) }),
    );

  const { body, query } = schemasOrFn;
  return defineEventHandler(async (event) =>
    (fn as (context: Inferred<S> & BaseContext) => unknown)({
      event,
      body: body ? await readValidatedBody(event, (data) => z.object(body).parse(data)) : undefined,
      query: query ? await getValidatedQuery(event, (data) => z.object(query).parse(data)) : undefined,
      router: routerProxy(event),
      user: event.context.user,
    } as Inferred<S> & BaseContext),
  );
}
