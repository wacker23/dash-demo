import type { NextPage } from 'next';
import Layout from "../../components/Layout";
import {Button, Grid, Paper, TextField, Typography} from "@mui/material";
import {Circle, Map, MapMarker} from "react-kakao-maps-sdk";
import React, {useState} from "react";
import {useRouter} from "next/router";

const NewPlace: NextPage = () => {
  const route = useRouter();
  const [placeName, setPlaceName] = useState('');
  const [position, setPosition] = useState<number[]>([]);

  const degreeToString = (float: number) => {
    if (!float) return '';
    const degree = Math.floor(float);
    const minute = Math.floor((float - degree) * 60);
    const second = Math.floor((((float - degree) * 60) - minute) * 60);
    return `${degree.toString().padStart(2, '0')}° ${minute.toString().padStart(2, '0')}' ${second.toString().padStart(2, '0')}"`;
  };

  const handleChangePlaceName = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setPlaceName(event.target.value);
  };

  const handleMapClick = (_t: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
    setPosition([
      Math.round(mouseEvent.latLng.getLng() * 1000000) / 1000000,
      Math.round(mouseEvent.latLng.getLat() * 1000000) / 1000000,
    ]);
  }

  const handleCancel = () => {
    return route.replace('/');
  };

  const handleSave = () => {
    // check form
    if (!placeName) {
      alert('장소 이름을 적어주세요.')
      return;
    }

    if (position.length !== 2) {
      alert('지도에서 설치 장소를 찍어주세요.')
      return;
    }

    console.log(`${position[1]}, ${position[0]}`);

    alert('정상적으로 저장되었습니다.');
  };

  return (
    <Layout title={'설치장소 추가'}>
      <Grid
        item
        xs={12}
        sx={{height: 'calc(100vh - 140px)'}}>
        <Grid container>
          <Grid item xs={12}>
            <Paper
              sx={{
                display: 'flex',
                flexDirection: 'column',
                p: 1.5,
                height: 'calc(100vh - 140px)',
              }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                설치 장소 추가하기
              </Typography>
              <Grid item marginBottom={2}>
                <TextField
                  label={'이름'}
                  variant={'filled'}
                  fullWidth
                  value={placeName}
                  onChange={handleChangePlaceName} />
              </Grid>
              <Grid
                container
                flexDirection={'row'}
                spacing={2}
                marginBottom={2}>
                <Grid item xs={6}>
                  <TextField
                    label={'위도'}
                    variant={'filled'}
                    fullWidth
                    value={`${degreeToString(position[1] ?? 0)}`}
                    InputProps={{
                      readOnly: true,
                    }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    sx={{ display: 'flex', }}
                    label={'경도'}
                    variant={'filled'}
                    fullWidth
                    value={`${degreeToString(position[0] ?? 0)}`}
                    InputProps={{
                      readOnly: true,
                    }} />
                </Grid>
              </Grid>
              <Grid item xs={12} marginBottom={2}>
                <Map
                  style={{ width: '100%', height: '100%', }}
                  center={{lat: 36.883333, lng: 127.158333}}
                  level={1}
                  onClick={handleMapClick}>
                  {position.length > 0 && (
                    <Circle
                      center={{lat: position[1], lng: position[0]}}
                      radius={5}
                      strokeOpacity={0}
                      fillColor={'#FF8AEF'}
                      fillOpacity={0.75} />
                  )}
                </Map>
              </Grid>
              <Grid container justifyContent={'space-between'}>
                <Button variant={'contained'} color={'secondary'} onClick={handleCancel}>
                  취소
                </Button>
                <Button variant={'contained'} color={'secondary'} onClick={handleSave}>
                  저장
                </Button>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Layout>
  );
}

export default NewPlace;
