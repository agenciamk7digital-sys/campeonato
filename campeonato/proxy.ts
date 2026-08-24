import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value
              );
            }
          );

          response =
            NextResponse.next({
              request,
            });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname =
    request.nextUrl.pathname;

  const estaEmAdmin =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const estaNoLogin =
    pathname === "/login";

  /*
   * ============================================================
   * NÃO AUTENTICADO TENTANDO ENTRAR NO ADMIN
   * ============================================================
   */

  if (estaEmAdmin && !user) {
    const url =
      request.nextUrl.clone();

    url.pathname = "/login";

    url.searchParams.set(
      "redirect",
      pathname
    );

    return NextResponse.redirect(
      url
    );
  }

  /*
   * ============================================================
   * JÁ AUTENTICADO ENTRANDO NO LOGIN
   * ============================================================
   */

  if (estaNoLogin && user) {
    const url =
      request.nextUrl.clone();

    url.pathname = "/admin";
    url.search = "";

    return NextResponse.redirect(
      url
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
  ],
};
