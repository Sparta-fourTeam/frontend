import Container from "@/components/layout/Container";
import Paper from "@/components/common/Paper";
import Title from "@/components/common/Title";
import SignInForm from "./components/signInForm";

export default function SignIn() {
  return (
    <Container>
      <Paper>
        <Title title="로그인" subtitle="계정을 선택해 시작하세요" />
        <SignInForm />
      </Paper>
    </Container>
  );
}
