import { FormEvent, Fragment, useState } from 'react';
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import KeyIcon from '@mui/icons-material/Key'
import { useSnackbar } from '../lib/useSnackbar'
import { useSession } from '../lib/useSession'
import { useRouter } from 'next/router'

type Props = {
  title?: string
};

const Login = ({title}: Props) => {
  const router = useRouter();
  const snackbar = useSnackbar();
  const session = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [is2FA, setIs2FA] = useState(false);
  const [passcode, setPasscode] = useState('');

  const handleChangePasscode = (value: string) => {
    setPasscode(value.slice(0, 6).replace(/\D/g, ''))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (username.trim() === "") {
      snackbar.toast("warning", "아이디를 입력해주세요.")
      return
    }
    if (password.trim() === "") {
      snackbar.toast("warning", "비밀번호를 입력해주세요.")
      return
    }

    try {
      const {need_2fa} = await session.signIn(username, password);
      if (!need_2fa) {
        snackbar.toast("success", "로그인에 성공하였습니다.");
        router.reload();
      }
      setIs2FA(need_2fa);
    } catch (err) {
      if (err instanceof Error) {
        snackbar.toast("error", err.message);
      }
    }
  };

  const handle2FASubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passcode.trim() === "") {
      snackbar.toast("warning", "인증코드를 입력해주세요.")
      return;
    }

    try {
      await session.challenge(username, passcode);
      snackbar.toast("success", "로그인에 성공하였습니다.");
      router.reload();
    } catch (err) {
      if (err instanceof Error) {
        snackbar.toast("error", err.message);
      }
    }
  }

  return (
    <Fragment>
      <Box sx={{
        display: "flex",
        flex: 1,
        flexDirection: 'column',
        justifyContent: "center",
        alignItems: "center"
      }}>
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          width: 340,
          mt: -4,
        }}>
          {is2FA ? (
            <>
              <Typography
                variant={"h5"}
                component={"h1"}
                noWrap={true}
                sx={{ mb: 1.5, mx: 0, mt: 0, p: 0, textAlign: "center" }}>
                {'2단계 인증'}
              </Typography>
              <form onSubmit={handle2FASubmit}>
                <Box sx={{ display: "flex", mx: 0, my: 0.5 }}>
                  <TextField
                    id={"passcode"}
                    type={'number'}
                    label={"인증코드 (6자리 숫자)"}
                    variant={"filled"}
                    autoSave={"off"}
                    autoCapitalize={"off"}
                    autoComplete={"off"}
                    fullWidth={true}
                    value={passcode}
                    onChange={({ target: { value } }) => handleChangePasscode(value)}
                  />
                </Box>
                <Box sx={{ display: "flex", mx: 0, my: 0.5 }}>
                  <Button
                    type={"submit"}
                    variant={"contained"}
                    color={"primary"}
                    fullWidth={true}
                    startIcon={<KeyIcon />}
                  >
                    인증하기
                  </Button>
                </Box>
              </form>
            </>
          ) : (
            <>
              <Typography
                variant={"h5"}
                component={"h1"}
                noWrap={true}
                sx={{ mb: 1.5, mx: 0, mt: 0, p: 0, textAlign: "center" }}>
                {title ?? 'STL'}
              </Typography>
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: "flex", mx: 0, my: 0.5 }}>
                  <TextField
                    id={"username"}
                    label={"아이디"}
                    variant={"filled"}
                    autoSave={"off"}
                    autoCapitalize={"off"}
                    autoComplete={"off"}
                    fullWidth={true}
                    value={username}
                    onChange={({ target: { value } }) => setUsername(value)}
                  />
                </Box>
                <Box sx={{ display: "flex", mx: 0, my: 0.5 }}>
                  <TextField
                    id={"password"}
                    type={"password"}
                    label={"비밀번호"}
                    variant={"filled"}
                    autoSave={"off"}
                    autoCapitalize={"off"}
                    autoComplete={"off"}
                    fullWidth={true}
                    value={password}
                    onChange={({ target: { value } }) => setPassword(value)}
                  />
                </Box>
                <Box sx={{ display: "flex", mx: 0, my: 0.5 }}>
                  <Button
                    type={"submit"}
                    variant={"contained"}
                    color={"primary"}
                    fullWidth={true}
                    startIcon={<LockOpenIcon />}
                  >
                    로그인
                  </Button>
                </Box>
              </form>
            </>
          )}
        </Box>
      </Box>
    </Fragment>
  )
}

export default Login
