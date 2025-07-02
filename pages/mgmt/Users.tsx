import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { API_URI } from '../../lib/server';
import Layout from '../../components/Layout';
import UserDto from '../../types/user.dto';
import {
  Box, Button, Collapse, FormControl, FormControlLabel,
  Grid, InputLabel,
  MenuItem,
  Typography,
} from '@mui/material';
import EnhancedTable from '../../components/EnhancedTable';
import TextField from '@mui/material/TextField';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { useUser } from '../../lib/useUser';
import OrganizationDto from '../../types/organization.dto';
import { useSnackbar } from '../../lib/useSnackbar';
import { useRouter } from 'next/router';

type UserRole = 'admin' | 'moderator' | 'user';

interface IUser {
  id: number;
  username: string;
  name: string;
  phone_number: string;
  role_name: UserRole;
  organization_name: string;
  privileged: boolean;
  is_active: boolean;
}

const OrganizationSelect = (props: {
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}) => {
  const { value, onChange } = props;
  const [options, setOptions] = useState<string[]>([]);

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    onChange(event.target.value as string);
  }

  const fetchOptions = useCallback(async () => {
    try {
      const result = await fetch(`/api/organization/names`);
      if (result.status / 100 === 2) {
        const data = await result.json() as string[];
        setOptions(data.map((name) => name));
      } else {
        setOptions([value]);
      }
    } catch (_) {
      setOptions([value]);
    }
  }, [value]);

  useEffect(() => {
    fetchOptions().then(() => false);
  }, [fetchOptions]);

  return (
    <FormControl
      disabled={props.disabled ?? false}
      variant={'standard'}
      sx={{ minWidth: 180 }}>
      <InputLabel>조직</InputLabel>
      <Select
        value={options.includes(value) ? value : ''}
        onChange={handleChange}>
        {options.map((option) => (
          <MenuItem
            key={option}
            value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

const EditUser = ({ user }: { user?: IUser }) => {
  const router = useRouter();
  const userInfo = useUser();
  const isEdit = user !== undefined;
  const {toast} = useSnackbar();
  const [organizationName, setOrganizationName] = useState(user?.organization_name ?? userInfo.organization);
  const [username, setUsername] = useState(user?.username ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number ?? '');
  const [role, setRole] = useState(user?.role_name ?? '');
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [isEditPassword, setIsEditPassword] = useState(false);

  const handleChangePhoneNumber = (event: ChangeEvent<HTMLInputElement>) => {
    if (/\D/g.test(event.target.value)) {
      return;
    }
    setPhoneNumber(event.target.value);
  }

  const handleSave = async () => {
    if (username.trim().length === 0) {
      toast('warning', '아이디를 입력해주세요.');
      return;
    }
    if (name.trim().length === 0) {
      toast('warning', '이름를 입력해주세요.');
      return;
    }
    if ((!isEdit || isEditPassword) && password.trim().length === 0) {
      toast('warning', '비밀번호를 입력해주세요.');
      return;
    }

    if (isEdit) {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: isEditPassword ? password : undefined,
          name,
          phone_number: phoneNumber,
          role_name: role,
          organization_name: organizationName,
          is_active: isActive,
        }),
      });
      let data = await response.json();
      if (response.status / 100 === 2) {
        data = data as { success: boolean };
        if (data.success) {
          toast('success', '정상적으로 변경되었습니다.');
          // setTimeout(router.reload, 500);
        }
      } else {
        data = data as { description: string };
        toast('error', data.description);
        handleReset();
      }
    } else {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          name,
          phone_number: phoneNumber,
          role_name: role,
          organization_name: organizationName,
          is_active: isActive,
        }),
      });
      let data = await response.json();
      if (response.status / 100 === 2) {
        data = data as { success: boolean };
        if (data.success) {
          toast('success', '정상적으로 등록되었습니다.');
          router.reload();
        }
      } else {
        data = data as { description: string };
        toast('error', data.description);
        handleReset();
      }
    }
  }

  const handleReset = () => {
    setOrganizationName(user?.organization_name ?? '');
    setName(user?.name ?? '');
    setPhoneNumber(user?.phone_number ?? '');
    setRole(user?.role_name ?? '');
    setIsActive(user?.is_active ?? true);
  }

  return (
    <Box>
      <Typography variant='h6' gutterBottom component={'div'}>
        {isEdit ? `사용자(${user.username}) 정보 수정` : '사용자 추가'}
      </Typography>
      <Grid
        container
        sx={{ alignItems: 'center' }}
        spacing={4}>
        <Grid item>
          <OrganizationSelect
            disabled={!userInfo.privileged}
            value={organizationName}
            onChange={value => setOrganizationName(value)} />
        </Grid>
        {!isEdit && (
          <Grid item>
            <TextField
              type={'number'}
              variant={'standard'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              label={'사용자 아이디'} />
          </Grid>
        )}
        <Grid item>
          <TextField
            variant={'standard'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            label={'사용자 이름'} />
        </Grid>
        <Grid item>
          {isEdit ? (
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <Collapse
                in={isEditPassword}
                sx={{
                  transition: (theme) => theme.transitions.create('width', {
                    duration: theme.transitions.duration.standard,
                  }),
                  width: 0,
                  '&.MuiCollapse-entered': {
                    width: 200,
                  },
                  '&.MuiCollapse-hidden': {
                    width: 0,
                  },
                }}>
                <TextField
                  variant={'standard'}
                  type={'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label={'패스워드 수정'} />
              </Collapse>
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={isEditPassword}
                    onChange={(e) => setIsEditPassword(e.target.checked)} />
                )}
                label={'패스워드 수정'} />
            </Box>
          ) : (
            <TextField
              variant={'standard'}
              type={'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label={'사용자 패스워드'} />
          )}
        </Grid>
        <Grid item>
          <TextField
            variant={'standard'}
            value={phoneNumber}
            onChange={handleChangePhoneNumber}
            label={'전화번호'} />
        </Grid>
        <Grid item>
          <FormControl
            variant={'standard'}
            sx={{ minWidth: 180 }}>
            <InputLabel id={'user-role-select-label'}>
              사용자 권한
            </InputLabel>
            <Select
              labelId={'user-role-select-label'}
              id={'user-role-select'}
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}>
              <MenuItem value={'admin'}>관리자</MenuItem>
              <MenuItem value={'moderator'}>중간 관리자</MenuItem>
              <MenuItem value={'user'}>일반 사용자</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item>
          <FormControlLabel
            control={<Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
            label={'계정 활성화'} />
        </Grid>
        <Grid item>
          <Button
            sx={{ mx: 1 }}
            variant={'outlined'}
            onClick={handleSave}>
            저장
          </Button>
          <Button
            sx={{ mx: 1 }}
            variant={'outlined'}
            onClick={handleReset}>
            초기화
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const Users = ({
  users,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const snackbar = useSnackbar();
  const router = useRouter();
  const getRoleName = (role: 'admin' | 'moderator' | 'user', privileged: boolean) => {
    switch (role) {
      case 'admin':
        return privileged ? '최고 관리자' : '조직 관리자';
      case 'moderator':
        return '중간 관리자';
      case 'user':
        return '일반 사용자';
    }
  }

  const handleBatchDelete = async (ids: readonly number[]) => {
    await Promise.all(
      ids.map(async id => {
        const response = await fetch(`/api/users/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          snackbar.toast('success', '정상적으로 삭제가 되었습니다.');
        } else {
          const data = await response.json() as { description: string };
          snackbar.toast('error', data.description);
        }
      }),
    );
    router.reload();
  }

  const handleDelete = async (id: number) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      snackbar.toast('success', '정상적으로 삭제가 되었습니다.');
      router.reload();
    } else {
      snackbar.toast('error', '삭제하는데 오류가 발생했습니다.');
    }
  }

  return (
    <Layout title={'사용자 관리'}>
      <Grid
        item
        xs={12}
        sx={{
          maxHeight: 'calc(100vh - 102px)',
        }}>
        <EnhancedTable
          searchColumns={['username', 'name', 'organization_name']}
          cols={[
            { id: 'username', label: '사용자 이름', },
            { id: 'name', label: '이름', },
            { id: 'role_name', label: '사용자 권한', },
            { id: 'organization_name', label: '조직명', },
            { id: 'is_active', label: '활성 여부', },
          ]}
          createLabel={'사용자 추가'}
          rows={users.map(user => (
            {
              id: user.id,
              username: user.username,
              name: user.name,
              role_name: getRoleName(user.role_name, user.privileged),
              organization_name: user.organization_name,
              is_active: user.is_active ? '활성' : '비활성',
              renderEdit: () => <EditUser user={user} />,
              onDelete: (id) => handleDelete(id),
            }
          ))}
          renderCreate={() => (
            <EditUser />
          )}
          onBatchDelete={ids => handleBatchDelete(ids)} />
      </Grid>
    </Layout>
  )
}

export default Users

export const getServerSideProps = (async (context) => {
  const token = context.req.cookies['HANLAID'];
  if (!token) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  let result = await fetch(`${API_URI}/profile`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const user = await result.json() as UserDto;
  if (!(user.privileged || user.role === 'admin')) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  result = await fetch(`${API_URI}/users/all`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  let users = await result.json() as IUser[];
  return {
    props: {
      users: users ?? [],
    },
  };
}) satisfies GetServerSideProps<{
  users: IUser[],
}>
