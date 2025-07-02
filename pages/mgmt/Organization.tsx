import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Layout from '../../components/Layout';
import { API_URI } from '../../lib/server';
import UserDto from '../../types/user.dto';
import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import EnhancedTable from '../../components/EnhancedTable';
import { ChangeEvent, useState } from 'react';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import { useSnackbar } from '../../lib/useSnackbar';
import { useRouter } from 'next/router';
import { styled } from '@mui/material/styles';
import Image from 'next/image';

interface IOrganization {
  id: number;
  name: string;
  center_x: number;
  center_y: number;
  logo_uri: string;
  privileged: boolean;
  is_active: boolean;
}

const FileUploadInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: 1,
  whiteSpace: 'nowrap',
});

const EditOrganization = ({ organization }: { organization?: IOrganization }) => {
  const isEdit = organization !== undefined;
  const snackbar = useSnackbar();
  const router = useRouter();
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoUri, setLogoUri] = useState(organization?.logo_uri ?? '');
  const [organizationName, setOrganizationName] = useState(organization?.name ?? '');
  const [isActive, setIsActive] = useState(organization?.is_active ?? true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadState, setUploadState] = useState<'ready' | 'done'>('ready');

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files === null) {
      return;
    }
    console.log(event.target.files[0].name)
    setLogoImage(event.target.files[0]);
    setUploadState('ready');
  }

  const handleFileUpload = async () => {
    if (logoImage === null) {
      return;
    }

    setIsUploading(true);

    // image data to arraybuffer and send to server
    const arrayBuffer = await logoImage.arrayBuffer();
    // arraybuffer to base64 on browser
    const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

    const response = await fetch('/api/bucket/upload', {
      method: 'POST',
      body: JSON.stringify({
        filename: logoImage.name,
        contentType: logoImage.type,
        data: base64,
      }),
    });

    if (response.status / 100 === 2) {
      const data = await response.json() as { success: boolean; id: string; filename: string; uri: string };
      if (data.success) {
        setLogoUri(data.uri);
        setLogoImage(null);
      }
    }
    setUploadState('done');
    setIsUploading(false);
  }

  const handleSave = async () => {
    if (organizationName.trim().length === 0) {
      snackbar.toast('warning', '조직 이름를 입력하세요.');
      return;
    }

    if (isEdit) {
      // send a request to update
      const response = await fetch(`/api/organization/${organization.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: organizationName,
          logo_uri: logoUri,
          is_active: isActive,
        }),
      });
      if (response.status / 100 === 2) {
        snackbar.toast('success', '성공적으로 수정되었습니다.');
        router.reload();
      }
    } else {
      // send a request to create
      const response = await fetch('/api/organization/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: organizationName,
          logo_uri: logoUri,
          is_active: isActive,
        }),
      });
      if (response.status / 100 === 2) {
        snackbar.toast('success', '성공적으로 등록되었습니다.');
        router.reload();
      }
    }
  }

  const handleReset = () => {
    setOrganizationName(organization?.name ?? '');
    setLogoUri(organization?.logo_uri ?? '');
    setLogoImage(null);
    setIsActive(organization?.is_active ?? true);
  }

  return (
    <Box>
      <Typography variant='h6' gutterBottom component={'div'}>
        {isEdit ? `${organization.name} 정보 변경` : '조직 추가'}
      </Typography>
      <Grid container sx={{ alignItems: 'center' }}>
        <Grid item xs={2}>
          <TextField
            variant={'standard'}
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            label={'조직명'} />
        </Grid>
        <Grid item xs={2}>
          <FormControlLabel
            control={(
              <Checkbox
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)} />
            )}
            label={'조직 활성화'} />
        </Grid>
      </Grid>
      <Grid
        container
        flexDirection={'column'}
        spacing={1}
        sx={{ mt: 1.5 }}>
        <Grid item>
          {logoImage ? (
            <Image
              src={URL.createObjectURL(logoImage)}
              alt={logoImage.name}
              width={120}
              height={46} />
          ) : logoUri.trim() !== '' ? (
            <Image
              src={`https://api.stl1.co.kr${logoUri}`}
              alt={'조직 로고'}
              width={120}
              height={46}
              onError={() => setLogoUri('')} />
          ) : (
            <Box
              display={'flex'}
              flexDirection={'column'}
              justifyContent={'center'}
              alignItems={'center'}
              sx={{
                width: 120,
                height: 46,
                border: '1px dashed gray',
                borderRadius: 2,
                cursor: 'pointer',
                userSelect: 'none',
                mb: 1,
              }}>
              <Typography variant={'body1'}>
                조직 로고 이미지
              </Typography>
            </Box>
          )}
          <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
            <Button
              variant={'contained'}
              role={undefined}
              component={'label'}
              startIcon={<CloudUploadIcon />}
              tabIndex={-1}>
              조직 로고
              <FileUploadInput type={'file'} onChange={handleFileChange} />
            </Button>
            <Button
              sx={{ mx: 1.5 }}
              variant={'outlined'}
              onClick={handleFileUpload}>
              업로드
            </Button>
          </Box>
          <Typography
            sx={{ mt: 1, }}
            variant={'body1'}>
            {isUploading ? '이미지를 업로드 중입니다...' : uploadState === 'done' ? '이미지 업로드가 완료되었습니다.' : '이미지 업로드를 해주세요.'}
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Button
            variant={'outlined'}
            disabled={logoImage !== null && (uploadState === 'ready' || isUploading)}
            onClick={handleSave}>
            저장
          </Button>
          <Button
            sx={{ mx: 1 }}
            variant={'outlined'}
            disabled={logoImage !== null && (uploadState === 'ready' || isUploading)}
            onClick={handleReset}>
            초기화
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

const Organization = ({
  organizations,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const snackbar = useSnackbar();
  const router = useRouter();

  const handleBatchDelete = async (ids: readonly number[]) => {
    await Promise.all(
      ids.map(async id => {
        const response = await fetch(`/api/organization/${id}`, {
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
    const response = await fetch(`/api/organization/${id}`, {
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
    <Layout title={'조직 관리'}>
      <Grid
        item
        xs={12}
        sx={{
          height: 'calc(100vh - 102px)',
        }}>
        <EnhancedTable
          searchColumns={['name']}
          cols={[
            { id: 'name', label: '조직명', },
            { id: 'privileged', label: '조직 정보', },
            { id: 'is_active', label: '활성 여부', },
          ]}
          createLabel={'조직 추가'}
          rows={organizations.map(organization => (
            {
              id: organization.id,
              name: organization.name,
              privileged: organization.privileged ? '관리 조직' : '일반 조직',
              is_active: organization.is_active ? '활성' : '비활성',
              renderEdit: () => <EditOrganization organization={organization} />,
              onDelete: (id) => handleDelete(id),
            }
          ))}
          renderCreate={() => (
            <EditOrganization />
          )}
          onBatchDelete={ids => handleBatchDelete(ids)} />
      </Grid>
    </Layout>
  )
}

export default Organization

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
  if (!user.privileged) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  // fetch data from API
  result = await fetch(`${API_URI}/organization/all`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const organizations = await result.json() as IOrganization[];
  return {
    props: {
      organizations: organizations ?? [],
    },
  };
}) satisfies GetServerSideProps<{
  organizations: IOrganization[],
}>
