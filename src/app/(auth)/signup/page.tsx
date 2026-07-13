import Link from "next/link";
import { signup } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">🍚 아이밥</CardTitle>
        <CardDescription>
          이유식 레시피 추천 서비스에 오신 걸 환영해요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signup} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@email.com"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="8자 이상 입력"
              minLength={8}
              required
            />
          </div>
          {searchParams.error && (
            <p className="text-sm text-red-500">{searchParams.error}</p>
          )}
          <SubmitButton
            className="w-full bg-orange-500 hover:bg-orange-600"
            pendingText="가입 중..."
          >
            회원가입
          </SubmitButton>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?&nbsp;
        <Link
          href="/login"
          className="text-orange-500 hover:underline font-medium"
        >
          로그인
        </Link>
      </CardFooter>
    </Card>
  );
}
