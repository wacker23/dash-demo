import type { NextPage } from 'next'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import TableRowsIcon from '@mui/icons-material/TableRows';
import MapIcon from '@mui/icons-material/Map';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { usePlaces, useSearchAddr } from '../lib/useAPI';
import { Circle, CustomOverlayMap, Map, MapInfoWindow } from 'react-kakao-maps-sdk';
import CustomMapMarker from '../components/CustomMapMarker';
import EquipmentDialog from '../components/EquipmentDialog';
import SelectRegion, { SelectRegionOnMap } from '../components/SelectRegion';
import { styled } from '@mui/material/styles';
import { useUser } from '../lib/useUser';
import { getAddressByCoords } from '../lib/utils';
import { useApp } from '../lib/useApp';
import { useSession } from '../lib/useSession';
import ActionButton from '../components/ActionButton';
import Fab from '@mui/material/Fab';

interface TooltipState {
  position: kakao.maps.LatLng;
  label: string;
}

interface GridItemProps {
  status: 'normal' | 'warn' | 'emergency' | 'blank';
}

const STATUS_COLOR = {
  normal: '#4fff4f',
  warn: '#ffa64e',
  emergency: '#ff4c4c',
  blank: '#fefefe'
};

const GridItem = styled(Paper)<GridItemProps>(({ theme, status }) => ({
  ...theme.typography.body2,
  backgroundColor: STATUS_COLOR[status],
  textAlign: 'center',
  color: '#232323',
  fontWeight: 'bold',
  minWidth: 95,
  height: 40,
  lineHeight: '40px',
}))

const Home: NextPage = () => {
  const app = useApp();
  const user = useUser();
  const session = useSession();
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [mapLevel, setMapLevel] = useState(3);
  const [detailId, setDetailId] = useState('');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [page, setPage] = useState(0);
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [mapCenter, setMapCenter] = useState({lat: 36.883334, lng: 127.158381});
  const {places, isLoading: isPlaceLoading} = usePlaces();
  const {searchData, loadPage: searchAddress} = useSearchAddr('');

  const statusColor = STATUS_COLOR;

  const groupedData = useMemo(() => {
    const groups: {[name: string]: {id: number, equipment_type: string, device_state: 'normal' | 'warn' | 'emergency' | 'blank'}[]} = {};
    if (!searchData.forEach) {
      return groups;
    }

    searchData.forEach(({location, id, equipment_type, device_state}) => {
      const data = {id, equipment_type, device_state};
      if (!groups[location.name]) {
        groups[location.name] = [];
      }
      groups[location.name].push({
        id, equipment_type, device_state,
      });
    });
    return groups;
  }, [searchData]);

  const handleViewStatus = (id: number, type: string) => {
    if (!user.privileged) {
      return;
    }

    if (isFullscreen) {
      document.exitFullscreen().then(() => false);
    }
    setDetailId(`${type}${id}`);
    setIsModalOpen(true);
  };

  const handleFullscreenChanged = () => {
    if (document.fullscreenElement !== null) {
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  };

  const handleFullScreen = async () => {
    if (!isFullscreen) {
      await mapWrapRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleViewMode = () => {
    if (viewMode === 'map') {
      app.setValue('viewMode', 'list');
      setViewMode('list');
    } else {
      app.setValue('viewMode', 'map');
      setViewMode('map');
      handleMapLoaded();
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setDetailId('');
  }

  const handleMapLoaded = useCallback(() => {
    const level = app.getValue('level');
    const coords = app.getValue('coords');
    if (level.trim() !== '') {
      setMapLevel(JSON.parse(level));
    }
    if (coords.trim() !== '') {
      const {lat, lng} = JSON.parse(coords);
      setMapCenter({lat, lng});
    }
  }, [app]);

  const handleMapCreate = async (map: kakao.maps.Map) => {
    const coords = app.getValue('coords');
    const center = map.getCenter();
    const [province, district] = await getAddressByCoords(center.getLat(), center.getLng());
    setProvince(province);
    setDistrict(district);
  }

  const handleBoundsChange = async (map: kakao.maps.Map) => {
    const level = map.getLevel();
    const center = map.getCenter();
    setMapLevel(level);
    if (level <= 6) {
      const [province, district] = await getAddressByCoords(center.getLat(), center.getLng());
      setProvince(province);
      setDistrict(district);
      app.setValue('address', `${province} ${district}`);
    }
    app.setValue('level', JSON.stringify(level));
    app.setValue('coords', JSON.stringify({lat: center.getLat(), lng: center.getLng()}));
  };

  useEffect(() => {
    const viewMode = (app.getValue('viewMode') || "map") as 'list' | 'map';
    const address = app.getValue('address') || '충청남도 천안시 서북구';
    setViewMode(viewMode);
    if (viewMode === 'map') {
      handleMapLoaded();
    } else {
      setProvince(address.split(' ')[0]);
      setDistrict(address.split(' ').slice(1).join(' '));
    }
  }, [app, handleMapLoaded]);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChanged);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChanged);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!isPlaceLoading && places && map) {
    }
  }, [isPlaceLoading, places, mapRef]);

  useEffect(() => {
    if (province.trim() !== '' && district.trim() !== '') {
      console.log(province.trim(), district.trim());
      searchAddress(`${province.trim()} ${district.trim()}`);
    }
  }, [province, district, searchAddress]);

  return (
    <Layout
      title={'고장 예측 AI 원격 관제'}
      menuBar={[{
        icon: viewMode === 'map' ? <TableRowsIcon /> : <MapIcon />,
        iconName: 'view-mode',
        iconLabel: viewMode === 'map' ? '리스트 보기' : '지도로 보기',
        onClick: handleViewMode,
      }]}>
      <Grid item xs={12}>
        {(session.isLoggedIn && viewMode === 'list') && (
          <>
            <SelectRegion
              province={province}
              district={district}
              onProvinceChange={value => {
                setProvince(value);
                setDistrict('');
              }}
              onDistrictChange={value => {
                setDistrict(value);
                app.setValue('address', `${province} ${value}`);
              }}/>
            <Box sx={{
              height: 'calc(100vh - 165px)'
            }}>
              <Grid
                container
                spacing={1.5}
                justifyContent={'center'}
                alignItems={searchData.length > 0 ? 'flex-start' : 'center'}
                sx={{
                  my: 1, px: 1, pb: 2,
                  ...(searchData.length === 0 && {
                    height: '100%',
                  }),
                }}>
                {Object.entries(groupedData).map(([locationName, items]) => (
                  <Grid key={`group-${locationName}`} item>
                    <Paper
                      variant={'elevation'}
                      elevation={4}
                      sx={{
                        width: 342,
                        px: 2, py: 3,
                      }}>
                      <Typography variant={'h5'}>{locationName}</Typography>
                      <Grid container spacing={1.5} sx={{mt: .5}}>
                        {items.map(({id, equipment_type, device_state}) => (
                          <Grid key={`item-${equipment_type}-${id}`} item>
                            <ActionButton
                              onClick={() => handleViewStatus(id, equipment_type)}
                              // renderAction={() => (
                              //   <Box
                              //     component={'div'}
                              //     sx={{
                              //       display: 'flex',
                              //       flexDirection: 'row',
                              //       alignItems: 'center',
                              //       position: 'absolute',
                              //       transform: 'translate(-10%, -200%)',
                              //       gap: '15px',
                              //     }}>
                              //     <Fab color={'primary'}>
                              //       <AccessAlarmIcon />
                              //     </Fab>
                              //     <Fab color={'primary'}>
                              //       <RestartAltIcon />
                              //     </Fab>
                              //   </Box>
                              // )}
                            >
                              <GridItem elevation={4} status={device_state}>
                                {`${equipment_type} ${id}`}
                              </GridItem>
                            </ActionButton>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
                {searchData.length === 0 && (
                  <Grid item xs={12} container justifyContent={'center'}>
                    <Typography variant={'h6'}>
                      {province.trim() === '' && '시/도를 선택해주세요.'}
                      {province.trim() !== '' && district.trim() === '' && '시/군/구를 선택해주세요.'}
                      {province.trim() !== '' && district.trim() !== '' && '이 지역에 설치된 장비가 없습니다.'}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </>
        )}
        {(session.isLoggedIn && viewMode === 'map') && (
          <Paper
            sx={{
              display: 'flex',
              flexDirection: 'column',
              p: .5,
              height: 'calc(100vh - 92px)',
            }}>
            {!isPlaceLoading && places && (
              <div
                ref={mapWrapRef}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative'
                }}>
                <Map
                  ref={mapRef}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  center={mapCenter}
                  level={mapLevel}
                  onCreate={handleMapCreate}
                  onBoundsChanged={handleBoundsChange}>
                  <SelectRegionOnMap
                    province={province}
                    district={district}
                  />
                  {mapLevel > 2 && places.map && places.map(({name, state, latitude, longitude, equipments}) => (
                    equipments.length > 0 ? (
                      <CustomMapMarker
                        key={`marker-${latitude}-${longitude}`}
                        alertLevel={state}
                        name={name}
                        lat={latitude}
                        lng={longitude}
                        equipments={equipments}
                        onViewStatus={handleViewStatus} />
                    ) : <></>
                  ))}
                  {mapLevel <= 2 && places.map && places.map(({equipments}) => equipments.map(({id, equipment_type, device_state, latitude, longitude}) => (
                    <CustomOverlayMap
                      key={`overlay-${latitude}-${longitude}`}
                      position={{
                        lat: latitude + 0.000015 * mapLevel,
                        lng: longitude,
                      }}
                      yAnchor={1.4}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: statusColor[device_state],
                          px: 1,
                          py: .5,
                          borderRadius: 15,
                          cursor: 'pointer',
                          '&:after': {
                            content: '""',
                            width: 0,
                            height: 0,
                            borderLeft: '10px solid transparent',
                            borderRight: '10px solid transparent',
                            borderTop: `10px solid ${statusColor[device_state]}`,
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            mt: '-3px',
                          },
                        }}
                        onClick={() => handleViewStatus(id, equipment_type)}>
                        <Typography fontWeight={'bold'} fontSize={8}>
                          {`${equipment_type} ${id}`}
                        </Typography>
                      </Box>
                    </CustomOverlayMap>
                  )))}
                  {mapLevel <= 2 && places.map(({equipments}) => equipments.map(({id, equipment_type, device_state, latitude, longitude}) => (
                    <div key={`circle-${equipment_type}-${id}`}>
                      <Circle
                        strokeOpacity={0}
                        center={{
                          lat: latitude,
                          lng: longitude,
                        }}
                        radius={mapLevel > 1 ? 2.5 : 1.5}
                        fillColor={statusColor[device_state]}
                        fillOpacity={1}
                        onClick={() => handleViewStatus(id, equipment_type)} />
                    </div>
                  )))}
                  {tooltip && (
                    <MapInfoWindow
                      position={{
                        lat: tooltip.position.getLat() + 0.000015 * mapLevel,
                        lng: tooltip.position.getLng(),
                      }}>
                      <div style={{display: 'flex', width: 150, justifyContent: 'center', alignItems: 'center'}}>
                      <span style={{fontSize: 20, fontWeight: 'bold', color: '#121212'}}>
                        {tooltip.label}
                      </span>
                      </div>
                    </MapInfoWindow>
                  )}
                  <IconButton
                    color={'secondary'}
                    aria-label={'fullscreen'}
                    sx={{
                      display: { sm: 'inline-flex', xs: 'none' },
                      backgroundColor: '#000',
                      position: 'absolute',
                      bottom: 5,
                      right: 5,
                      zIndex: 10,
                      '&:hover': {
                        backgroundColor: '#000',
                      },
                    }}
                    onClick={handleFullScreen}>
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                  </IconButton>
                </Map>
              </div>
            )}
          </Paper>
        )}
      </Grid>
      <EquipmentDialog
        visible={isModalOpen}
        id={detailId}
        onClose={handleModalClose} />
    </Layout>
  )
}

export default Home
