import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

export default async function Home() {
  // Token kontrolü yap
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  // Token yoksa login sayfasına yönlendir
  if (!token) {
    redirect("/login");
  }

  try {
    // Token doğrulama
    verify(token, process.env.JWT_SECRET as string);
    // Token geçerliyse dashboard'a yönlendir
    redirect("/dashboard");
  } catch (error) {
    // Token geçersizse login sayfasına yönlendir
    redirect("/login");
  }
}
