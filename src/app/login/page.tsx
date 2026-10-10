import { isDemoMode } from "@/lib/demo";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return <LoginForm demoMode={isDemoMode()} />;
}
