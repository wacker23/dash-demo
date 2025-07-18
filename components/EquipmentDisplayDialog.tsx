import { forwardRef, Fragment, Ref, useEffect, useMemo, useState, useCallback } from 'react';
import {
  AppBar, Box,
  Container,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  Tooltip,
  Badge
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import Slide from '@mui/material/Slide';
import {DataGrid, GridPaginationModel} from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import {createDisplayInfoCols} from '../lib/createColsdisplay';
import Chart from './Chart';
import { useEquipmentDisplayInfo, useEquipmentInfo } from '../lib/useAPI';
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, {Dayjs} from "dayjs";
import useSWR, { useSWRConfig } from 'swr';
import { useSnackbar } from '../lib/useSnackbar';
import { useApp } from '../lib/useApp';
import AddressDto from '../types/address.dto';

type Props = {
  visible: boolean;
  onClose?: () => void;
  id: string;
};

type TabPanelProps = {
  children?: JSX.Element | JSX.Element[];
  index: number;
  value: number;
};

function TabPanel(props: TabPanelProps) {
  return (
    <div
      role={'tabpanel'}
      hidden={props.value !== props.index}
      id={`tab-panel-${props.index}`}>
      {props.value === props.index && (
        <Paper
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 155px)',
          }}>
          {props.children}
        </Paper>
      )}
    </div>
  );
}

const Transition = forwardRef(function Transition(
  props: any,
  ref: Ref<unknown>,
) {
  const {children, ...attr} = props;
  return <Slide direction="up" ref={ref} {...attr}>{children}</Slide>;
})

const EquipmentDisplayDialog = ({visible, ...props}: Props) => {
  const app = useApp();
  const {mutate, cache} = useSWRConfig();
  const snackbar = useSnackbar();
  const {device, isLoading} = useEquipmentInfo(props.id);
  const {
    clear, 
    displayInfo, 
    load, 
    isLoading: isDisplayLoading, 
    error: displayError,
    deviceStatuses,
    overallWarning
  } = useEquipmentDisplayInfo(props.id);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tabState, setTabState] = useState(1);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [addressKey, setAddressKey] = useState<string | null>(null);
  const {data: address} = useSWR<AddressDto>(addressKey);
  const displayInfoCols = useMemo(() => createDisplayInfoCols(), []);

  const handleClose = async () => {
    clear();
    setIsLoaded(false);
    props.onClose?.();
  };

  const handlePaginationChange = async ({page}: GridPaginationModel) => {
    // Pagination logic if needed
  };

  const loadDisplayInfo = useCallback(async () => {
    try {
      if (props.id.trim() !== '') {
        await load();
      }
    } catch (error) {
      console.error('Failed to load display info:', error);
      snackbar.toast('error', '디스플레이 정보를 불러오는 데 실패했습니다.');
    }
  }, [props.id, load, snackbar]);

  useEffect(() => {
    if (visible) {
      loadDisplayInfo().catch(console.error);
    }
  }, [visible, loadDisplayInfo]);

  const handleSearchRange = async () => {
    if (!startDate || !endDate) return;
    
    try {
      if (device?.statusRange) {
        if (device.statusRange.start) {
          const pv = dayjs(device.statusRange.start).format('YYYY-MM-DD');
          if (startDate.isBefore(pv)) {
            snackbar.toast('warning', '조회하는 시작일이 DB에 저장된 시간보다 너무 이릅니다. 수정하세요!!');
            return;
          }
        }
        if (device.statusRange.end) {
          const pv = dayjs(device.statusRange.end).format('YYYY-MM-DD');
          if (endDate.isAfter(pv)) {
            snackbar.toast('warning', '조회하는 종료일이 DB에 저장된 시간보다 너무 많습니다. 수정하세요!!');
            return;
          }
        }
      }
      const start = startDate.format('YYYY-MM-DD');
      const end = endDate.format('YYYY-MM-DD');
      
    } catch (error) {
      console.error('Failed to search range:', error);
      snackbar.toast('error', '날짜 범위 검색에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (device) {
      setAddressKey(
        `/api/kakao/coord2address?lat=${device.location.latitude}&lng=${device.location.longitude}`
      );
    }
  }, [device]);

  useEffect(() => {
    const filterStart = app.getValue('startDate') || null;
    const filterEnd = app.getValue('endDate') || null;
    setStartDate(!filterStart ? null : dayjs(filterStart));
    setEndDate(!filterEnd ? null : dayjs(filterEnd));
  }, [app]);

  useEffect(() => {
    if (visible) {
      loadDisplayInfo().catch(console.error);
    }
  }, [visible, loadDisplayInfo]);

  useEffect(() => {
    if (visible && displayInfo) {
      setIsLoaded(true);
    }
  }, [visible, displayInfo]);

  const deviceCount = useMemo(() => {
    if (!displayInfo || !Array.isArray(displayInfo)) return 0;
    const uniqueDeviceIds = new Set(displayInfo.map(item => item.deviceid));
    return uniqueDeviceIds.size;
  }, [displayInfo]);

  const gridData = useMemo(() => {
    if (!displayInfo || !Array.isArray(displayInfo)) return [];
    
    return [...displayInfo]
      .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
      .map((item, index) => ({
        ...item,
        id: item.id || `${props.id}-${index}`,
        receive_date: item.updated_at,
        temp: item.temperature,
        currR: item.current_red,
        currG: item.current_green,
        offCurrR: item.off_current_red,
        offCurrG: item.off_current_green,
        voltR: item.voltage_red,
        voltG: item.voltage_green,
      }));
  }, [displayInfo, props.id]);

  // Get device status for each device
  const getDeviceStatus = (deviceId: number) => {
    return deviceStatuses.find(status => status.deviceid === deviceId);
  };

  // Get unique device IDs for the grid
  const activeDeviceIds = useMemo(() => {
    if (!displayInfo || !Array.isArray(displayInfo)) return new Set<number>();
    return new Set(displayInfo.map(item => Number(item.deviceid)));
  }, [displayInfo]);

  return (
    <Dialog
      fullScreen
      open={visible}
      onClose={handleClose}
      TransitionComponent={Transition}>
      <AppBar>
        <Toolbar variant={'dense'}>
          <IconButton
            edge={'start'}
            color={'inherit'}
            onClick={handleClose}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {`장비(${props.id}) 장치 상태 정보`}
          </Typography>
          <Box sx={{ ml: 2, flexGrow: 1, flexDirection: 'row' }}>
            {device && (
              <Typography variant={'subtitle1'} sx={{ fontSize: { xs: '.75rem', sm: '1rem' } }}>
                {device.location.name}
                {deviceCount > 0 && ` (${deviceCount}개 장치)`}
              </Typography>
            )}
            {address && (
              <Typography sx={{ fontSize: { xs: '.50rem', sm: '.75rem' } }}>
                {address.address_name}
              </Typography>
            )}
          </Box>
          {/* Overall Warning Indicator */}
          {overallWarning && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: (() => {
              if (overallWarning.includes('critical')) return 'error.main'; // Critical - Red
              if (overallWarning.includes('high')) return 'error.light'; // High - Light Red
              if (overallWarning.includes('medium')) return 'warning.main'; // Medium - Orange
              if (overallWarning.includes('low')) return 'warning.light'; // Low - Yellow
              return 'success.main'; // Default/None - Green
              })(),
              px: 1,
              borderRadius: 1,
              ml: 2
            }}>
              <WarningIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {overallWarning}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              display: 'none',
              '@media (min-width: 960px) and (min-height: 640px)': {
                display: 'block',
              },
            }}>
            <>
              {device && (
                <Grid container>
                  <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Box display={'flex'} alignItems={'center'}>
                        <Paper>
                          <DatePicker
                            sx={{
                              '& .MuiInputBase-input': {
                                py: 0.5,
                                width: 90,
                              },
                              '& .MuiInputLabel-root': {
                                fontSize: '1.2rem',
                                '&.MuiInputLabel-outlined': {
                                  lineHeight: '1.1rem',
                                },
                              },
                            }}
                            label={'시작일'}
                            minDate={device.statusRange?.start ? dayjs(device.statusRange.start) : undefined}
                            maxDate={device.statusRange?.end ? dayjs(device.statusRange.end) : undefined}
                            value={startDate}
                            onChange={value => {
                              setStartDate(value);
                              if (value) {
                                app.setValue('startDate', value.format('YYYY-MM-DD'));
                              }
                            }} />
                        </Paper>
                        <Box mx={1}>-</Box>
                        <Paper>
                          <DatePicker
                            sx={{
                              '& .MuiInputBase-input': {
                                py: 0.5,
                                width: 90,
                              },
                              '& .MuiInputLabel-root': {
                                fontSize: '1.2rem',
                                '&.MuiInputLabel-outlined': {
                                  lineHeight: '1.1rem',
                                },
                              },
                            }}
                            label={'종료일'}
                            minDate={startDate}
                            maxDate={device.statusRange?.end ? dayjs(device.statusRange.end) : undefined}
                            value={endDate}
                            onChange={value => {
                              setEndDate(value);
                              if (value) {
                                app.setValue('endDate', value.format('YYYY-MM-DD'));
                              }
                            }} />
                        </Paper>
                        <IconButton
                          edge={'start'}
                          color={'inherit'}
                          sx={{mx: 1}}
                          onClick={handleSearchRange}>
                          <SearchIcon />
                        </IconButton>
                      </Box>
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              )}
            </>
          </Box>
        </Toolbar>
      </AppBar>
      <DialogContent>
        <Box
          sx={{
            display: 'block',
            '@media (min-width: 960px) and (min-height: 640px)': {
              display: 'none',
            },
            mt: 5
          }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            디스플레이 정보
          </Typography>
          {isDisplayLoading ? (
            <Typography>디스플레이 정보를 불러오는 중입니다...</Typography>
          ) : gridData.length > 0 ? (
            <DataGrid
              columns={displayInfoCols}
              rows={gridData}
              pageSizeOptions={[100]}
              localeText={{
                noRowsLabel: '디스플레이 정보가 없습니다.',
              }} />
          ) : (
            <Typography>디스플레이 정보가 없습니다.</Typography>
          )}
        </Box>
        <Container
          maxWidth={false}
          sx={{
            display: 'none',
            '@media (min-width: 960px) and (min-height: 640px)': {
              display: 'block',
            }
          }}>
          <Grid container sx={{mt: 5}} spacing={3}>
            <Grid item xs={12}>
              <Tabs
                variant={'fullWidth'}
                value={tabState}
                onChange={(_e, value) => setTabState(value)}>
                <Tab
                  label={'그래프'}
                  id={'tab-panel-1'}
                  aria-controls={'tab-panel-1'}
                  value={1} />
                <Tab
                  label={'상세 정보'}
                  id={'tab-panel-2'}
                  aria-controls={'tab-panel-2'}
                  value={2} />
              </Tabs>
              <TabPanel value={tabState} index={1}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                  디스플레이 정보 그래프
                </Typography>
                <>
                  {isDisplayLoading ? (
                    <Typography>데이터를 불러오는 중입니다...</Typography>
                  ) : gridData.length > 0 ? (
                    <Chart
                      data={gridData}
                      tooltipContent={({active, payload, label}) => {
                        const receive_date = dayjs(label).format('YYYY년 MM월 DD일 HH시 mm분 ss초');
                        return (
                          <>
                            {active && payload && payload.length && (
                              <Paper sx={{px: 2, py: 1, backgroundColor: '#202123'}}>
                                <>
                                  {payload.map(item => (
                                    <Fragment key={item.dataKey}>
                                      {String(item.dataKey) === 'temp' && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${item.value}°C`}
                                        </Typography>
                                      )}
                                      {String(item.dataKey).startsWith('volt') && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${item.value}V`}
                                        </Typography>
                                      )}
                                      {String(item.dataKey).startsWith('curr') && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${item.value}mA`}
                                        </Typography>
                                      )}
                                      {String(item.dataKey).startsWith('offCurr') && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${item.value}A`}
                                        </Typography>
                                      )}
                                    </Fragment>
                                  ))}
                                  <Typography color={'white'}>
                                    {receive_date}
                                  </Typography>
                                </>
                              </Paper>
                            )}
                          </>
                        );
                      }}
                      XAxis={{
                        dataKey: 'receive_date',
                        tickFormatter: (value: Date) =>
                          `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`,
                      }}
                      YAxis={[ 
                        {
                          yAxisId: 'tempAxis',
                          tickFormatter: value => `${value}°C`,
                          domain: [-35, 120],
                        },
                        {
                          yAxisId: 'currAxis',
                          orientation: 'right',
                          tickFormatter: value => `${value}A`,
                          domain: [
                            0,
                            Math.max(
                              gridData[0]?.current_red ?? 0, 
                              gridData[0]?.current_green ?? 0,
                              gridData[0]?.off_current_red ?? 0,
                              gridData[0]?.off_current_green ?? 0
                            ) * 1.2,
                          ]
                        },
                        {
                          yAxisId: 'voltAxis',
                          orientation: 'right',
                          tickFormatter: value => `${value}V`,
                          domain: [24]
                        },
                      ]}
                      lineData={[
                        {key: 'temp', name: '온도', color: '#ffd700', type: 'monotone', yAxisId: 'tempAxis'},
                        {key: 'voltR', name: '전압 R', color: '#ff6347', type: 'monotone', yAxisId: 'voltAxis'},
                        {key: 'voltG', name: '전압 G', color: '#32cd32', type: 'monotone', yAxisId: 'voltAxis'},
                        {key: 'currR', name: '전류 R', color: '#ff4500', type: 'monotone', yAxisId: 'currAxis'},
                        {key: 'currG', name: '전류 G', color: '#228b22', type: 'monotone', yAxisId: 'currAxis'},
                        {key: 'offCurrR', name: '오프 전류 R', color: '#e9967a', type: 'monotone', yAxisId: 'currAxis'},
                        {key: 'offCurrG', name: '오프 전류 G', color: '#20b2aa', type: 'monotone', yAxisId: 'currAxis'},
                      ]} />
                  ) : (
                    <Typography>표시할 데이터가 없습니다.</Typography>
                  )}
                </>
              </TabPanel>
              <TabPanel value={tabState} index={2}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                  디스플레이 상세 정보
                </Typography>
                {isDisplayLoading ? (
                  <Typography>데이터를 불러오는 중입니다...</Typography>
                ) : gridData.length > 0 ? (
                  <DataGrid
                    columns={displayInfoCols}
                    rows={gridData}
                    pageSizeOptions={[100]}
                    localeText={{
                      noRowsLabel: '디스플레이 정보가 없습니다.',
                    }} />
                ) : (
                  <Typography>디스플레이 정보가 없습니다.</Typography>
                )}
              </TabPanel>
            </Grid>
          </Grid>
        </Container>

        {/* Device Grid Panel with Warning Indicators */}
        <Container
          maxWidth={false}
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: '#1c1c1c',
            borderRadius: 1,
            borderTop: '1px solid rgb(5, 4, 4)'
          }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            장치 상태 그리드
          </Typography>
          <Grid container spacing={1} sx={{ justifyContent: 'center' }}>
            {Array.from({ length: 64 }).map((_, index) => {
              const deviceId = index;
              const isActive = activeDeviceIds.has(deviceId);
              const deviceStatus = getDeviceStatus(deviceId);
              const hasWarning = deviceStatus && deviceStatus.warningLevel !== 'none';

              return (
                <Grid item key={index} xs={3} sm={2} md={1.5} lg={1}>
                  <Tooltip 
                    title={
                      deviceStatus ? (
                        <Paper sx={{ px: 1, py: 0.5, backgroundColor: '#202123' }}>
                          <Typography variant="body2">
                            Device: {deviceStatus.deviceid}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg Red: {deviceStatus.avgCurrentRed.toFixed(2)}mA
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg Green: {deviceStatus.avgCurrentGreen.toFixed(2)}mA
                          </Typography>
                          <Typography variant="body2" color={hasWarning ? 'error' : 'success'}>
                            {deviceStatus.warningMessage}
                          </Typography>
                        </Paper>
                      ) : (
                        <Typography variant="body2">No data available</Typography>
                      )
                    }
                    placement="top"
                    arrow
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '90%',
                        height: '50px',
                        aspectRatio: '1/1',
                        bgcolor: isActive ? 'transparent' : 'grey.300',
                        border: '1px solid',
                        borderColor: 'grey.400',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'scale(1.05)',
                          transition: 'all 0.2s'
                        }
                      }}>
                      {isActive ? (
                        <>
                          <Box
                            sx={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '50%',
                              bgcolor: 'success.main',
                              opacity: 0.8
                            }} />
                          <Box
                            sx={{
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              bottom: 0,
                              width: '50%',
                              bgcolor: 'error.main',
                              opacity: 0.8
                            }} />
                          <Typography
                            variant="body2"
                            sx={{
                              position: 'relative',
                              zIndex: 1,
                              fontWeight: 'bold',
                              color: 'common.white',
                              textShadow: '0 0 2px rgba(0,0,0,0.8)',
                              fontSize: '0.75rem',
                              '@media (min-width:600px)': {
                                fontSize: '0.875rem'
                              }
                            }}>
                            {index}
                          </Typography>
                          {hasWarning && (
                            <WarningIcon
                              sx={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                color: 'warning.main',
                                fontSize: '1rem',
                                filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))'
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'grey.600',
                            fontSize: '0.75rem',
                            '@media (min-width:600px)': {
                              fontSize: '0.875rem'
                            }
                          }}>
                          {index}
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentDisplayDialog;
