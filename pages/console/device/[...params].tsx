import dayjs, { Dayjs } from 'dayjs'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers"
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs"
import Layout from '../../../components/AdminLayout'
import { useSnackbar } from '../../../lib/useSnackbar'
import { useSession } from '../../../lib/useSession'
import { useGeoLocation } from '../../../lib/utils'
import { ProvinceMap } from '../../../lib/constants'
import useSWR from 'swr';
import Select from '../../../components/Select';
import { Dialog, DialogActions, DialogContent, DialogTitle, Modal } from '@mui/material';
import { useEquipmentInfo } from '../../../lib/useAPI';

const NewEquipment: NextPage = () => {
  const {coords, updatePosition} = useGeoLocation();
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map>(null);
  const router = useRouter();
  const { params } = router.query as { params: string[] };
  const session = useSession();
  const snackbar = useSnackbar();
  const [isLoaded, setIsLoaded] = useState(false);
  const [editId, setEditId] = useState('');
  const [equipId, setEquipId] = useState('');
  const [interval, setInterval] = useState(3600);
  const [manufacturerDate, setManufacturerDate] = useState<Dayjs | null>();
  const [installedAddr, setInstalledAddr] = useState('');
  const [modemId, setModemId] = useState('');
  const [units, setUnits] = useState(0);
  const [isValidId, setIsValidId] = useState(true);
  const [nearbyUrl, setNearbyUrl] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState(-1);
  const [defaultPlaceName, setDefaultPlaceName] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [placeMemo, setPlaceMemo] = useState('');
  const [openPlaceInput, setOpenPlaceInput] = useState(false);
  const [mapCenter, setMapCenter] = useState({...coords});
  const [placeMapCenter, setPlaceMapCenter] = useState({...coords});
  const {data: nearby} = useSWR<{id: number, name: string}[]>(nearbyUrl);
  const {device} = useEquipmentInfo(editId);

  useEffect(() => {
    if (params) {
      const [mode, id] = params;
      if (isLoaded) {
        if (mode === 'new') {
          updatePosition();
        } else if (mode === 'edit' && device) {
          if ("id" in device) {
            setModemId(device.modem_id);
            setManufacturerDate(dayjs(device.manufacturing_date));
            setMapCenter({
              lat: device.latitude,
              lng: device.longitude,
            });
            setDefaultPlaceName(device.location.name);
            setInstalledAddr(device.address ?? '');
            findLocalInfo(device.latitude, device.longitude);
            setUnits(device.units);
            setPlaceMemo(device.memo);
          } else {
            router.push('/console').then(() => false);
          }
        }
      } else {
        if (mode === 'new') {
          setIsLoaded(true);
        } else if (mode === 'edit' && params.length > 1) {
          const regex = new RegExp('(AGL|DGL|VGL|BGL|LGL)(\\d+)', 'ig');
          if (regex.test(id)) {
            setEquipId(id);
            setEditId(id);
            setIsLoaded(true);
          } else {
            router.push('/console').then(() => false);
          }
        } else {
          router.push('/console').then(() => false);
        }
      }
    }
  }, [isLoaded, params, router, device, updatePosition]);

  useEffect(() => {
    setMapCenter({...coords});
    setPlaceMapCenter({...coords});
  }, [coords]);

  useEffect(() => {
    findLocalInfo(mapCenter.lat, mapCenter.lng);
  }, [mapCenter]);

  useEffect(() => {
    if (nearby && nearby.length > 0) {
      const item = nearby.find((item) => item.name === defaultPlaceName);
      if (item) {
        setPlaceId(item.id);
      }
    }
  }, [nearby, defaultPlaceName]);

  const handleChangeId = (e: ChangeEvent<HTMLInputElement>) => {
    const regex = new RegExp('(AGL|DGL|VGL|BGL|LGL)(\\d+)', 'ig');
    setEquipId(e.target.value);
    setIsValidId(regex.test(e.target.value));
  }

  const handleDragMap = (map: kakao.maps.Map) => {
    setMapCenter({
      lat: map.getCenter().getLat(),
      lng: map.getCenter().getLng(),
    });
  };

  const handleDragPlaceMap = (map: kakao.maps.Map) => {
    setPlaceMapCenter({
      lat: map.getCenter().getLat(),
      lng: map.getCenter().getLng(),
    });
  };

  const findLocalInfo = (lat: number, lng: number) => {
    if (mapRef.current) {
      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.coord2Address(lng, lat, (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          const province = ProvinceMap[result[0].address.region_1depth_name];
          const district = result[0].address.region_2depth_name;
          setInstalledAddr(`${province} ${district}`);
        }
      });
    }
  };

  const loadNearby = (lat: number, lng: number) => {
    setNearbyUrl(`/api/place/nearby/?lat=${lat}&lng=${lng}&radius=250`);
  };

  const handleSave = async () => {
    const [mode] = params;
    const regex = new RegExp('(AGL|DGL|VGL|BGL|LGL)(\\d+)', 'ig');
    const result = regex.exec(equipId);

    if (!result) {
      alert('장비 ID를 입력해주세요.');
      return;
    }

    if (modemId.trim() === '') {
      alert('모뎀 ID를 입력해주세요.');
      return;
    }

    if (units === 0) {
      alert('표출부 개수를 입력해주세요.');
      return;
    }

    if (mode.trim() === 'new') {
      const response = await fetch('/api/device/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: Number(result[2]),
          equipment_type: result[1],
          device_state: 'NEW',
          interval,
          modem_id: modemId,
          units,
          address: installedAddr,
          latitude: mapCenter.lat,
          longitude: mapCenter.lng,
          manufacturing_date: manufacturerDate?.toISOString(),
          location_id: placeId,
          memo: placeMemo,
          is_active: true,
        }),
      });

      let data = await response.json();
      if (data['success']) {
        snackbar.toast('success', '정상적으로 등록되었습니다.');
        await router.replace('/console/');
      } else {
        snackbar.toast('error', '등록에 실패하였습니다.');
      }
    } else if (mode.trim() === 'edit') {
      const response = await fetch(`/api/device/${equipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_state: 'NORMAL',
          interval,
          modem_id: modemId,
          units,
          address: installedAddr,
          latitude: mapCenter.lat,
          longitude: mapCenter.lng,
          manufacturing_date: manufacturerDate?.toISOString(),
          order_date: null,
          location_id: placeId,
          memo: placeMemo,
          is_active: true,
        }),
      });

      let data = await response.json();
      if ("success" in data) {
        if (data['success']) {
          snackbar.toast('success', '정상적으로 수정되었습니다.');
          await router.replace('/console/');
        } else {
          snackbar.toast('success', '수정된 항목이 없습니다.');
        }
      } else {
        snackbar.toast('error', '수정에 실패하였습니다.');
      }
    }
  };

  const handleAddPlace = () => {
    setOpenPlaceInput(true);
  };

  const handleClosePlaceInput = () => {
    setOpenPlaceInput(false);
  }

  const handleSavePlace = async () => {
    if (placeName.trim() === '') {
      return;
    }

    const response = await fetch('/api/place/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: placeName,
        latitude: placeMapCenter.lat,
        longitude: placeMapCenter.lng,
        install_date: dayjs().toISOString(),
      }),
    });

    let data = await response.json();
    if (data['success']) {
      snackbar.toast('success', '정상적으로 장소 등록되었습니다.');
    } else {
      snackbar.toast('error', '장소 등록에 실패하였습니다.');
    }

    setPlaceName('');
    setOpenPlaceInput(false);
  }

  if (!session.isLoaded) {
    return <></>;
  }

  if (!session.isLoggedIn) {
    router.replace('/console').then(() => false);
  }

  return (
    <Layout title={'새 장비 등록'} layoutType={'edit'}>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <TextField
            label={'장비 ID'}
            variant={'filled'}
            autoSave={'off'}
            autoCapitalize={'off'}
            autoComplete={"off"}
            fullWidth
            value={equipId}
            error={!isValidId}
            helperText={!isValidId && '장비 ID 규칙에 맞지 않습니다. ex) AGL1, DGL2, VGL3, BGL4, LGL5'}
            onChange={handleChangeId} />
        </Grid>
        <Grid item xs={12}>
          <TextField
            type={'number'}
            label={'interval'}
            variant={'filled'}
            autoSave={'off'}
            autoCapitalize={'off'}
            autoComplete={"off"}
            fullWidth
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))} />
        </Grid>
        <Grid item xs={12}>
          <TextField
            contentEditable={false}
            label={'모뎀 ID'}
            variant={'filled'}
            autoSave={'off'}
            autoCapitalize={'off'}
            autoComplete={"off"}
            fullWidth
            value={modemId}
            onChange={e => setModemId(e.target.value)} />
        </Grid>
        <Grid item xs={12}>
          <TextField
            type={'number'}
            label={'표출부 개수'}
            variant={'filled'}
            autoSave={'off'}
            autoCapitalize={'off'}
            autoComplete={"off"}
            fullWidth
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))} />
        </Grid>
        <Grid item xs={12}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              sx={{width: '100%'}}
              disableFuture
              label={'설치일'}
              value={manufacturerDate}
              onChange={value => setManufacturerDate(value)}/>
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              {nearby && nearby.length > 0 && (
                <Select
                  options={nearby.map(({id, name}) => (
                    {label: name, value: id}
                  ))}
                  label={'장소'}
                  selectedValue={placeId}
                  onChange={id => setPlaceId(id)} />
              )}
            </Grid>
            <Grid item xs={4}>
              <Button
                sx={{height: '100%'}}
                variant={"contained"}
                color={"secondary"}
                fullWidth={true}
                onClick={handleAddPlace}>
                새 장소 추가
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                contentEditable={false}
                label={'위도'}
                variant={'filled'}
                autoSave={'off'}
                autoCapitalize={'off'}
                autoComplete={"off"}
                fullWidth
                value={mapCenter.lat} />
            </Grid>
            <Grid item xs={6}>
              <TextField
                contentEditable={false}
                label={'경도'}
                variant={'filled'}
                autoSave={'off'}
                autoCapitalize={'off'}
                autoComplete={"off"}
                fullWidth
                value={mapCenter.lng} />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <TextField
            contentEditable={false}
            label={'주소'}
            variant={'filled'}
            autoSave={'off'}
            autoCapitalize={'off'}
            autoComplete={"off"}
            fullWidth
            value={installedAddr} />
        </Grid>
        <Grid item xs={12}>
          <TextField
            contentEditable={false}
            label={'메모 (선택사항)'}
            variant={'filled'}
            autoSave={'off'}
            autoCapitalize={'off'}
            autoComplete={"off"}
            fullWidth
            value={placeMemo}
            onChange={e => setPlaceMemo(e.target.value)} />
        </Grid>
        <Grid item xs={12}>
          <div
            ref={mapWrapRef}
            style={{
              width: '100%',
              height: 520,
              position: 'relative'
            }}>
            <Map
              ref={mapRef}
              style={{
                width: '100%',
                height: '100%',
              }}
              center={{ lat: mapCenter.lat, lng: mapCenter.lng }}
              level={2}
              onDrag={handleDragMap}
              onDragEnd={(map) => {
                findLocalInfo(map.getCenter().getLat(), map.getCenter().getLng());
                loadNearby(map.getCenter().getLat(), map.getCenter().getLng());
              }}>
              <MapMarker position={{ lat: mapCenter.lat, lng: mapCenter.lng }} />
            </Map>
          </div>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant={"contained"}
            color={"secondary"}
            fullWidth={true}
            startIcon={<GpsFixedIcon />}
            onClick={updatePosition}>
            현재 위치 찾기
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant={"contained"}
            color={"secondary"}
            fullWidth={true}
            onClick={handleSave}>
            등록하기
          </Button>
        </Grid>
      </Grid>
      <Dialog
        open={openPlaceInput}
        onClose={handleClosePlaceInput}>
        <DialogTitle>새 장소 등록</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={'장소 이름'}
            value={placeName}
            onChange={e => setPlaceName(e.target.value)}
          />
          <div style={{width: '100%', height: 520, minWidth: 320}}>
            <Map
              style={{
                width: '100%',
                height: '100%',
              }}
              center={{ lat: placeMapCenter.lat, lng: placeMapCenter.lng }}
              level={2}
              onDrag={handleDragPlaceMap}>
              <MapMarker position={{ lat: placeMapCenter.lat, lng: placeMapCenter.lng }} />
            </Map>
          </div>
          <Button
            variant={"contained"}
            color={"secondary"}
            fullWidth={true}
            startIcon={<GpsFixedIcon />}
            onClick={updatePosition}>
            현재 위치 찾기
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePlaceInput}>닫기</Button>
          <Button onClick={handleSavePlace}>등록</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default NewEquipment
