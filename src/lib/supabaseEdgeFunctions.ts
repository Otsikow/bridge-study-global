import {
  FunctionsClient,
  type FunctionInvokeOptions,
  type FunctionsResponse,
} from "@supabase/functions-js";
import { getSupabaseBrowserConfig } from "@/lib/supabaseClientConfig";

type HeadersRecord = Record<string, string>;

const SUPABASE_CONFIG = getSupabaseBrowserConfig();
const FUNCTIONS_BASE_URL = (() => {
  const base =
    SUPABASE_CONFIG.functionsUrl ?? `${SUPABASE_CONFIG.url}/functions/v1`;
  return base.replace(/\/+$/, "");
})();

const edgeFunctionsClient = new FunctionsClient(FUNCTIONS_BASE_URL, {
  headers: { apikey: SUPABASE_CONFIG.anonKey },
});

export interface EdgeFunctionInvokeOptions extends FunctionInvokeOptions {
  accessToken?: string | null;
  includeAnonKey?: boolean;
}

export const invokeEdgeFunction = async <T = unknown>(
  functionName: string,
  options: EdgeFunctionInvokeOptions = {},
): Promise<FunctionsResponse<T>> => {
  const { accessToken, includeAnonKey = false, headers, ...rest } = options;

  const finalHeaders: HeadersRecord = {
    apikey: SUPABASE_CONFIG.anonKey,
    ...(headers ?? {}),
  };

  const shouldAttachAnonToken = includeAnonKey || !finalHeaders.Authorization;
  const tokenToUse =
    accessToken ??
    (shouldAttachAnonToken ? SUPABASE_CONFIG.anonKey : undefined);

  if (tokenToUse && !finalHeaders.Authorization) {
    finalHeaders.Authorization = `Bearer ${tokenToUse}`;
  }

  return edgeFunctionsClient.invoke<T>(functionName, {
    ...rest,
    headers: finalHeaders,
  });
};
