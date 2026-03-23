#!/usr/bin/env bun
// Generates a typed API client for the dashboard from Nitro route handlers.
// Run from apps/backend/ directory.

import { Project, ts } from "ts-morph";
import { readdirSync, statSync, writeFileSync, mkdirSync, readFileSync } from "fs";
import { resolve, join } from "path";

const ROUTES_DIR = resolve("src/api/routes");
const PRISMA_SCHEMA_DIR = resolve("prisma/schema");
const OUTPUT_FILE = resolve("generated/client/index.ts");
const EXCLUDE_DIRS = new Set(["webhooks"]);
// Routes that return non-JSON (streams, redirects) — exclude from JSON client
const EXCLUDE_ROUTES = new Set(["/documents/:driveFileId", "/images/:driveId"]);

type Method = "get" | "post" | "patch" | "put" | "delete";

interface RouteFile {
  method: Method;
  urlPath: string; // /people/:id/status
  filePath: string; // absolute path to .ts file
  alias: string; // R_people_id_status_post
}

function* scanRoutes(dir: string, urlPrefix = ""): Generator<RouteFile> {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (EXCLUDE_DIRS.has(name)) continue;
      const seg = name.replace(/\[([^\]]+)\]/g, ":$1");
      yield* scanRoutes(full, `${urlPrefix}/${seg}`);
    } else {
      const m = name.match(/^(.+)\.(get|post|patch|put|delete)\.ts$/);
      if (!m) continue;
      const [, base, methodStr] = m;
      const method = methodStr as Method;
      const suffix = base === "index" ? "" : `/${base.replace(/\[([^\]]+)\]/g, ":$1")}`;
      const urlPath = `${urlPrefix}${suffix}` || "/";
      const alias =
        "R" +
        urlPath
          .replace(/:([^/]+)/g, "_$1")
          .replace(/\//g, "_")
          .replace(/-/g, "_") +
        "_" +
        method;
      if (EXCLUDE_ROUTES.has(urlPath)) continue;
      yield { method, urlPath, filePath: full, alias };
    }
  }
}

// Serialize a raw ts.Type to a standalone type string.
// Converts Date → string, Decimal → string (JSON serialization semantics).
function serializeRawType(type: ts.Type, checker: ts.TypeChecker, depth = 0, seen = new Set<ts.Type>()): string {
  if (depth > 12) return "unknown";

  const flags = type.flags;

  if (flags & ts.TypeFlags.String) return "string";
  if (flags & ts.TypeFlags.Number) return "number";
  if (flags & ts.TypeFlags.Boolean) return "boolean";
  if (flags & ts.TypeFlags.Null) return "null";
  if (flags & ts.TypeFlags.Undefined) return "undefined";
  if (flags & ts.TypeFlags.Void) return "void";
  if (flags & ts.TypeFlags.Unknown) return "unknown";
  if (flags & ts.TypeFlags.Never) return "never";
  if (flags & ts.TypeFlags.Any) return "unknown";

  if (flags & ts.TypeFlags.StringLiteral) return JSON.stringify((type as ts.StringLiteralType).value);
  if (flags & ts.TypeFlags.NumberLiteral) return String((type as ts.NumberLiteralType).value);
  if (flags & ts.TypeFlags.BooleanLiteral) return checker.typeToString(type);

  if (flags & ts.TypeFlags.Union) {
    const parts = (type as ts.UnionType).types.map((t) => serializeRawType(t, checker, depth + 1, seen));
    return [...new Set(parts)].join(" | ");
  }

  if (flags & ts.TypeFlags.Intersection) {
    return (type as ts.IntersectionType).types
      .map((t) => serializeRawType(t, checker, depth + 1, seen))
      .join(" & ");
  }

  if (flags & ts.TypeFlags.Object) {
    const sym = type.getSymbol();
    const symName = sym?.getName();

    // JSON serialization: these become strings
    if (symName === "Date" || symName === "Decimal" || symName === "Buffer") return "string";
    // Skip Response (non-JSON routes that slipped through)
    if (symName === "Response" || symName === "ReadableStream") return "unknown";

    // Detect arrays: Array<T> or T[]
    if (checker.isArrayType(type)) {
      const elem = checker.getTypeArguments(type as ts.TypeReference)[0];
      return elem ? `Array<${serializeRawType(elem, checker, depth + 1, seen)}>` : "Array<unknown>";
    }

    if (seen.has(type)) return "unknown";
    seen.add(type);

    // Use getPropertiesOfType which handles ALL type forms: mapped, Omit, spreads, intersections
    const props = checker.getPropertiesOfType(type);

    if (props.length === 0) {
      seen.delete(type);
      return "Record<string, unknown>";
    }

    const propStrs = props
      .map((sym) => {
        const name = sym.getName();
        if (name.startsWith("__") || name.startsWith("$")) return null;
        const propType = checker.getTypeOfSymbol(sym);
        const isOpt = !!(sym.flags & ts.SymbolFlags.Optional);
        const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
        return `${key}${isOpt ? "?" : ""}: ${serializeRawType(propType, checker, depth + 1, seen)}`;
      })
      .filter(Boolean);

    seen.delete(type);
    return `{ ${propStrs.join("; ")} }`;
  }

  // Fallback
  const text = checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
  if (/^[a-z]/.test(text)) return text;
  return "unknown";
}

// Tree node for proxy generation
interface TreeNode {
  methods: Map<Method, { alias: string; typeStr: string; body?: string; query?: string }>;
  statics: Map<string, { origName: string; child: TreeNode }>; // camelCase → { orig, child }
  param: { name: string; child: TreeNode } | null;
}

function makeNode(): TreeNode {
  return { methods: new Map(), statics: new Map(), param: null };
}

function toCamel(s: string) {
  return s.replace(/-([a-z])/g, (_, c) => (c as string).toUpperCase());
}

function buildTree(
  routes: RouteFile[],
  typeMap: Map<string, string>,
  requestMap: Map<string, { body?: string; query?: string }>,
): TreeNode {
  const root = makeNode();
  for (const route of routes) {
    const typeStr = typeMap.get(route.alias) ?? "unknown";
    const req = requestMap.get(route.alias);
    let node = root;
    const segments = route.urlPath === "/" ? [] : route.urlPath.split("/").filter(Boolean);
    for (const seg of segments) {
      if (seg.startsWith(":")) {
        const paramName = seg.slice(1);
        if (!node.param) node.param = { name: paramName, child: makeNode() };
        node = node.param.child;
      } else {
        const camelName = toCamel(seg);
        if (!node.statics.has(camelName)) node.statics.set(camelName, { origName: seg, child: makeNode() });
        node = node.statics.get(camelName)!.child;
      }
    }
    node.methods.set(route.method, { alias: route.alias, typeStr, ...req });
  }
  return root;
}

// Recursively generate the proxy object code.
// urlExpr: the URL path string for this level (e.g., "/people/${id}/status")
function genNode(node: TreeNode, urlExpr: string): string {
  const parts: string[] = [];

  for (const [method, { typeStr, body, query }] of node.methods) {
    const hasBody = !["get"].includes(method);
    const fn = hasBody
      ? `(body?: unknown) => doFetch<${typeStr}>(\`${urlExpr}\`, "${method.toUpperCase()}", body)`
      : `() => doFetch<${typeStr}>(\`${urlExpr}\`, "${method.toUpperCase()}")`;
    const fnType = hasBody ? `(body?: unknown) => Promise<${typeStr}>` : `() => Promise<${typeStr}>`;
    const phantom: string[] = [`$response: ${typeStr}`];
    const requestParts: string[] = [];
    if (body) requestParts.push(`body: ${body}`);
    if (query) requestParts.push(`query: ${query}`);
    if (requestParts.length > 0) phantom.push(`$request: { ${requestParts.join("; ")} }`);
    parts.push(`$${method}: (${fn}) as unknown as (${fnType}) & { ${phantom.join("; ")} }`);
  }

  for (const [camelName, { origName, child }] of node.statics)
    parts.push(`${camelName}: ${genNode(child, `${urlExpr}/${origName}`)}`);

  const staticObj = parts.length > 0 ? `{ ${parts.join(", ")} }` : "{}";

  if (!node.param) return staticObj;

  const { name: paramName, child } = node.param;
  // Build child URL: append /${paramName} as a template literal segment in the GENERATED file
  const childUrl = `${urlExpr}/\${${paramName}}`;
  const callableFn = `(${paramName}: string) => (${genNode(child, childUrl)})`;

  if (parts.length === 0) return callableFn;
  return `Object.assign(${callableFn}, ${staticObj})`;
}

/** Collect the TypeScript type of each `return expr` statement in an async function node.
 *  Walks only the top level of the function body — does not recurse into nested functions.
 *  Returns null if the node is not a recognizable function with a block body. */
function collectReturnTypes(fn: ts.Node, checker: ts.TypeChecker): string[] | null {
  let body: ts.Node | undefined;
  if (fn.kind === ts.SyntaxKind.ArrowFunction || fn.kind === ts.SyntaxKind.FunctionExpression) {
    body = (fn as ts.ArrowFunction | ts.FunctionExpression).body;
  }
  if (!body || body.kind !== ts.SyntaxKind.Block) return null;

  const types: string[] = [];

  function visit(node: ts.Node, topLevel: boolean) {
    if (node.kind === ts.SyntaxKind.ReturnStatement) {
      if (!topLevel) return;
      const expr = (node as ts.ReturnStatement).expression;
      if (!expr) return; // bare `return;` → void, skip
      let retType = checker.getTypeAtLocation(expr);
      // Unwrap Promise (for `return prisma.findMany()` without await)
      const sn = retType.getSymbol()?.getName() ?? "";
      if (sn.includes("Promise") || checker.getPropertiesOfType(retType).some((p) => p.getName() === "then")) {
        const args = checker.getTypeArguments(retType as ts.TypeReference);
        if (args.length > 0) retType = args[0];
      }
      types.push(serializeRawType(retType, checker));
      return;
    }
    // Don't recurse into nested function boundaries
    const isNestedFn =
      node.kind === ts.SyntaxKind.FunctionDeclaration ||
      node.kind === ts.SyntaxKind.ArrowFunction ||
      node.kind === ts.SyntaxKind.FunctionExpression ||
      node.kind === ts.SyntaxKind.MethodDeclaration;
    ts.forEachChild(node, (child) => visit(child, topLevel && !isNestedFn));
  }

  visit(body, true);
  return types;
}

function scanPrismaEnums(schemaDir: string): Map<string, string[]> {
  const enums = new Map<string, string[]>();
  for (const file of readdirSync(schemaDir).filter((f) => f.endsWith(".prisma"))) {
    const content = readFileSync(join(schemaDir, file), "utf-8");
    for (const match of content.matchAll(/^enum\s+(\w+)\s*\{([^}]+)\}/gm)) {
      const name = match[1];
      const values = match[2]
        .split("\n")
        .map((l) => l.replace(/\/\/.*/, "").trim())
        .filter(Boolean);
      enums.set(name, values);
    }
  }
  return enums;
}

interface PrismaField {
  name: string;
  type: string;
  isOptional: boolean;
  isList: boolean;
  isRelation: boolean;
}

interface PrismaModel {
  name: string;
  fields: PrismaField[];
}

const PRISMA_SCALAR_MAP: Record<string, string> = {
  String: "string",
  Int: "number",
  Float: "number",
  Boolean: "boolean",
  DateTime: "string",
  BigInt: "string",
  Decimal: "string",
  Bytes: "string",
  Json: "unknown",
};

function scanPrismaModels(schemaDir: string, enumNames: Set<string>): PrismaModel[] {
  const models: PrismaModel[] = [];
  for (const file of readdirSync(schemaDir).filter((f) => f.endsWith(".prisma"))) {
    const content = readFileSync(join(schemaDir, file), "utf-8");
    for (const match of content.matchAll(/^model\s+(\w+)\s*\{([^}]+)\}/gm)) {
      const name = match[1];
      const fields: PrismaField[] = [];
      for (const line of match[2].split("\n")) {
        const trimmed = line.replace(/\/\/.*/, "").trim();
        if (!trimmed) continue;
        const fieldMatch = trimmed.match(/^(\w+)\s+(\w+)(\[\])?\??/);
        if (!fieldMatch) continue;
        const [, fieldName, fieldType, listMarker] = fieldMatch;
        const isList = !!listMarker;
        const isOptional = trimmed.includes("?");
        // A field is a relation if it references another model (not a scalar, not an enum)
        const isRelation = !PRISMA_SCALAR_MAP[fieldType] && !enumNames.has(fieldType);
        fields.push({ name: fieldName, type: fieldType, isOptional, isList, isRelation });
      }
      models.push({ name, fields });
    }
  }
  return models;
}

function generateModelTypes(models: PrismaModel[], enumNames: Set<string>): string {
  const lines: string[] = [];
  for (const model of models) {
    const fieldLines: string[] = [];
    for (const field of model.fields) {
      if (field.isRelation) continue; // skip relation fields
      let tsType = PRISMA_SCALAR_MAP[field.type] ?? (enumNames.has(field.type) ? field.type : "unknown");
      if (field.isList) tsType = `${tsType}[]`;
      if (field.isOptional) tsType = `${tsType} | null`;
      fieldLines.push(`  ${field.name}: ${tsType};`);
    }
    lines.push(`export interface ${model.name} {\n${fieldLines.join("\n")}\n}`);
  }
  return lines.join("\n\n");
}

async function main() {
  const routes = [...scanRoutes(ROUTES_DIR)];
  console.log(`Found ${routes.length} routes`);

  // Create TypeScript project using backend's tsconfig (has all path aliases)
  const project = new Project({
    tsConfigFilePath: resolve("tsconfig.json"),
    addFilesFromTsConfig: false,
  });

  for (const route of routes) project.addSourceFileAtPath(route.filePath);
  project.resolveSourceFileDependencies();

  const checker = project.getTypeChecker().compilerObject;

  const typeMap = new Map<string, string>();
  const requestMap = new Map<string, { body?: string; query?: string }>();

  for (const route of routes) {
    try {
      const sf = project.getSourceFileOrThrow(route.filePath);
      const defaultExports = sf.getExportedDeclarations().get("default");
      if (!defaultExports?.length) {
        typeMap.set(route.alias, "unknown");
        continue;
      }

      // Get the type of the default export: EventHandler<H3Event, R> = (event) => R
      const declType = defaultExports[0].getType().compilerType;
      const callSigs = checker.getSignaturesOfType(declType, ts.SignatureKind.Call);
      if (!callSigs.length) {
        typeMap.set(route.alias, "unknown");
        continue;
      }

      // Try to collect types from individual return statements (avoids TypeScript union simplification).
      // e.g. a handler that returns FullPerson[] OR LimitedPerson[] normally collapses to LimitedPerson[]
      // because FullPerson extends LimitedPerson structurally — but individual return exprs preserve both.
      const declNode = defaultExports[0].compilerNode;
      let typeStr: string | null = null;
      if (declNode.kind === ts.SyntaxKind.CallExpression) {
        const handlerCall = declNode as ts.CallExpression;
        const fnArg = handlerCall.arguments[handlerCall.arguments.length - 1];
        if (fnArg) {
          const stmtTypes = collectReturnTypes(fnArg, checker);
          if (stmtTypes && stmtTypes.length > 0) {
            typeStr = [...new Set(stmtTypes)].join(" | ");
          }
        }
      }

      // Fall back to EventHandler return type inference
      if (!typeStr) {
        let returnType = checker.getReturnTypeOfSignature(callSigs[0]);
        const symName = returnType.getSymbol()?.getName() ?? "";
        if (
          symName.includes("Promise") ||
          checker.getPropertiesOfType(returnType).some((p) => p.getName() === "then")
        ) {
          const args = checker.getTypeArguments(returnType as ts.TypeReference);
          if (args.length > 0) returnType = args[0];
        }
        typeStr = serializeRawType(returnType, checker);
      }

      typeMap.set(route.alias, typeStr);
      console.log(`  ${route.alias}: ${typeStr.slice(0, 80)}...`);

      // Extract request body/query types from handler(schemas, fn) — inspect the callback's context param
      if (declNode.kind === ts.SyntaxKind.CallExpression) {
        const handlerCall = declNode as ts.CallExpression;
        if (handlerCall.arguments.length >= 2) {
          const fnArg = handlerCall.arguments[1];
          const fnType = checker.getTypeAtLocation(fnArg);
          const fnSigs = checker.getSignaturesOfType(fnType, ts.SignatureKind.Call);
          if (fnSigs.length > 0) {
            const params = fnSigs[0].getParameters();
            if (params.length > 0) {
              const contextType = checker.getTypeOfSymbol(params[0]);
              const req: { body?: string; query?: string } = {};
              const bodyProp = contextType.getProperty("body");
              if (bodyProp) req.body = serializeRawType(checker.getTypeOfSymbol(bodyProp), checker);
              const queryProp = contextType.getProperty("query");
              if (queryProp) req.query = serializeRawType(checker.getTypeOfSymbol(queryProp), checker);
              if (req.body ?? req.query) requestMap.set(route.alias, req);
            }
          }
        }
      }
    } catch (e) {
      console.warn(`  Warning: could not resolve type for ${route.alias}: ${(e as Error).message}`);
      typeMap.set(route.alias, "unknown");
    }
  }

  const tree = buildTree(routes, typeMap, requestMap);
  const clientBody = genNode(tree, "");

  const prismaEnums = scanPrismaEnums(PRISMA_SCHEMA_DIR);
  const enumNames = new Set(prismaEnums.keys());
  const enumLines = [...prismaEnums.entries()]
    .map(([name, values]) => `export type ${name} = ${values.map((v) => JSON.stringify(v)).join(" | ")};`)
    .join("\n");

  const prismaModels = scanPrismaModels(PRISMA_SCHEMA_DIR, enumNames);
  const modelLines = generateModelTypes(prismaModels, enumNames);

  const output = `\
// AUTO-GENERATED. DO NOT EDIT.
// Run 'bun run client:generate' in apps/backend to regenerate.

export interface NitroAPIOptions {
  baseUrl: string;
  fetch?: typeof fetch;
}

function _buildRoutes(doFetch: <T>(path: string, method: string, body?: unknown) => Promise<T>) {
  return ${clientBody};
}

class _NitroAPIBase {
  readonly $baseUrl: string;
  private readonly customFetch: typeof fetch;

  constructor(options: NitroAPIOptions) {
    this.$baseUrl = options.baseUrl;
    this.customFetch = options.fetch ?? fetch;
    Object.assign(this, _buildRoutes(this.doFetch.bind(this)));
  }

  private async doFetch<T>(path: string, method: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
    const res = await this.customFetch(\`\${this.$baseUrl}\${path}\`, {
      method,
      headers,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(\`API error \${res.status}: \${await res.text().catch(() => "")}\`);
    const text = await res.text();
    if (!text) return undefined as T;
    const ct = res.headers.get("content-type") ?? "";
    return (ct.includes("application/json") ? JSON.parse(text) : text) as T;
  }
}

export const NitroAPI = _NitroAPIBase as unknown as new (options: NitroAPIOptions) => _NitroAPIBase & ReturnType<typeof _buildRoutes>;
export type NitroAPI = InstanceType<typeof NitroAPI>;

// Prisma enum types
${enumLines}

// Prisma model types
${modelLines}

export type { SessionUser } from "../../src/services/auth";
`;

  mkdirSync(resolve("generated/client"), { recursive: true });
  writeFileSync(OUTPUT_FILE, output);
  console.log(`\nGenerated: ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
