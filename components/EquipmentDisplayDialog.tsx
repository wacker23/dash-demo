import { forwardRef, Fragment, Ref, useEffect, useMemo, useState, useCallback } from 'react';
import {
  AppBar,
  Box,
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
  Card,
  CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import Slide from '@mui/material/Slide';
import { DataGrid, GridPaginationModel } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import { createDisplayInfoCols } from '../lib/createColsdisplay';
import Chart from './Chart';
import { useEquipmentDisplayInfo, useEquipmentInfo } from '../lib/useAPI';
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import useSWR from 'swr';
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
  const { children, ...attr } = props;
  return <Slide direction="up" ref={ref} {...attr}>{children}</Slide>;
});

const EquipmentDisplayDialog = ({ visible, ...props }: Props) => {
  const app = useApp();
  const snackbar = useSnackbar();
  const { device, isLoading } = useEquipmentInfo(props.id);
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
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().endOf('day'));
  const [addressKey, setAddressKey] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const { data: address } = useSWR<AddressDto>(addressKey);
  const displayInfoCols = useMemo(() => createDisplayInfoCols(), []);

  // Calculate power consumption values
  const powerValues = useMemo(() => {
    if (!displayInfo || !Array.isArray(displayInfo)) {
      return {
        today: { 
          wattR: { avg: 0, min: 0, max: 0 },
          wattG: { avg: 0, min: 0, max: 0 }
        },
        monthly: { 
          wattR: { avg: 0, min: 0, max: 0 },
          wattG: { avg: 0, min: 0, max: 0 }
        }
      };
    }

    const todayStart = dayjs().startOf('day');
    const monthStart = dayjs().subtract(30, 'days').startOf('day');

    const todayData = displayInfo.filter(item => 
      dayjs(item.updated_at).isAfter(todayStart)
    );
    const monthlyData = displayInfo.filter(item => 
      dayjs(item.updated_at).isAfter(monthStart)
    );

    const calculateValues = (data: any[]) => {
      if (data.length === 0) return { 
        wattR: { avg: 0, min: 0, max: 0 },
        wattG: { avg: 0, min: 0, max: 0 }
      };

      const wattRValues = data.map(item => (item.voltage_red * item.current_red) / 1000).filter(val => !isNaN(val));
      const wattGValues = data.map(item => (item.voltage_green * item.current_green) / 1000).filter(val => !isNaN(val));

      return {
        wattR: {
          avg: wattRValues.reduce((sum, val) => sum + val, 0) / wattRValues.length,
          min: Math.min(...wattRValues),
          max: Math.max(...wattRValues)
        },
        wattG: {
          avg: wattGValues.reduce((sum, val) => sum + val, 0) / wattGValues.length,
          min: Math.min(...wattGValues),
          max: Math.max(...wattGValues)
        }
      };
    };

    return {
      today: calculateValues(todayData),
      monthly: calculateValues(monthlyData)
    };
  }, [displayInfo]);

  const handleClose = async () => {
    clear();
    setIsLoaded(false);
    props.onClose?.();
  };

  const handlePaginationChange = async ({ page }: GridPaginationModel) => {
    // Pagination logic if needed
  };

  const loadDisplayInfo = useCallback(async () => {
    try {
      if (props.id.trim() !== '') {
        await load();
      }
    } catch (error) {
      console.error('Failed to load display info:', error);
      snackbar.toast('error', 'Failed to load display information');
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
            snackbar.toast('warning', 'Start date is before the earliest available data');
            return;
          }
        }
        if (device.statusRange.end) {
          const pv = dayjs(device.statusRange.end).format('YYYY-MM-DD');
          if (endDate.isAfter(pv)) {
            snackbar.toast('warning', 'End date is after the latest available data');
            return;
          }
        }
      }
      
      app.setValue('startDate', startDate.format('YYYY-MM-DD'));
      app.setValue('endDate', endDate.format('YYYY-MM-DD'));
      await loadDisplayInfo();
    } catch (error) {
      console.error('Failed to search range:', error);
      snackbar.toast('error', 'Failed to search date range');
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
    const filterStart = app.getValue('startDate') || dayjs().startOf('day').format('YYYY-MM-DD');
    const filterEnd = app.getValue('endDate') || dayjs().endOf('day').format('YYYY-MM-DD');
    setStartDate(dayjs(filterStart));
    setEndDate(dayjs(filterEnd));
  }, [app]);

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
        "device ID": item.deviceid,
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

  const filteredGridData = useMemo(() => {
    let result = [...gridData];

    if (selectedDeviceId !== null) {
      result = result.filter(item => Number(item.deviceid) === selectedDeviceId);
    }

    // If both startDate and endDate are null, show last 24h
    if (!startDate && !endDate) {
      const now = dayjs();
      const last24h = now.subtract(24, 'hour').valueOf();
      result = result.filter(item => {
        const itemTime = new Date(item.receive_date).getTime();
        return itemTime >= last24h && itemTime <= now.valueOf();
      });
    } else if (startDate && endDate) {
      const startTime = startDate.startOf('day').valueOf();
      const endTime = endDate.endOf('day').valueOf();
      result = result.filter(item => {
        const itemTime = new Date(item.receive_date).getTime();
        return itemTime >= startTime && itemTime <= endTime;
      });
    }

    return result;
  }, [gridData, selectedDeviceId, startDate, endDate]);

  const getDeviceStatus = (deviceId: number) => {
    return deviceStatuses.find(status => status.deviceid === deviceId);
  };

  const activeDeviceIds = useMemo(() => {
    if (!displayInfo || !Array.isArray(displayInfo)) return new Set<number>();
    return new Set(displayInfo.map(item => Number(item.deviceid)));
  }, [displayInfo]);

  const handleDeviceClick = (deviceId: number) => {
    setSelectedDeviceId(prev => prev === deviceId ? null : deviceId);
  };

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
            {`장비 (${props.id}) 상태 정보`}
          </Typography>
          <Box sx={{ ml: 2, flexGrow: 1, flexDirection: 'row' }}>
            {device && (
              <Typography variant={'subtitle1'} sx={{ fontSize: { xs: '.75rem', sm: '1rem' } }}>
                {device.location.name}
                {deviceCount > 0 && ` (${deviceCount} devices)`}
                {selectedDeviceId !== null && ` - 선택한 device: ${selectedDeviceId}`}
              </Typography>
            )}
            {address && (
              <Typography sx={{ fontSize: { xs: '.50rem', sm: '.75rem' } }}>
                {address.address_name}
              </Typography>
            )}
          </Box>
          {overallWarning && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: (() => {
                if (overallWarning.includes('critical')) return 'error.main';
                if (overallWarning.includes('high')) return 'error.light';
                if (overallWarning.includes('medium')) return 'warning.main';
                if (overallWarning.includes('low')) return 'warning.light';
                return 'success.main';
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
                          label={'Start Date'}
                          minDate={device.statusRange?.start ? dayjs(device.statusRange.start) : undefined}
                          maxDate={device.statusRange?.end ? dayjs(device.statusRange.end) : undefined}
                          value={startDate}
                          onChange={value => {
                            setStartDate(value);
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
                          label={'End Date'}
                          minDate={startDate}
                          maxDate={device.statusRange?.end ? dayjs(device.statusRange.end) : undefined}
                          value={endDate}
                          onChange={value => {
                            setEndDate(value);
                          }} />
                      </Paper>
                      <IconButton
                        edge={'start'}
                        color={'inherit'}
                        sx={{ mx: 1 }}
                        onClick={handleSearchRange}>
                        <SearchIcon />
                      </IconButton>
                    </Box>
                  </LocalizationProvider>
                </Grid>
              </Grid>
            )}
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
            Display Information
          </Typography>
          {isDisplayLoading ? (
            <Typography>Loading display information...</Typography>
          ) : gridData.length > 0 ? (
            <DataGrid
            columns={displayInfoCols}
            rows={gridData}
            sortModel={[{ field: 'receive_date', sort: 'desc' }]}
            pageSizeOptions={[100]}
            localeText={{
              noRowsLabel: 'No display information available.',
            }} />
          ) : (
            <Typography>No display information available.</Typography>
          )}
        </Box>

        


      <Container
            maxWidth={false}
            sx={{
              position: 'relative',
              top: '30px',
              display: 'none',
              '@media (min-width: 960px) and (min-height: 640px)': {
                display: 'block',
              }
            }}
          >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Tabs
                variant={'fullWidth'}
                value={tabState}
                onChange={(_e, value) => setTabState(value)}>
                <Tab label={'그래프'} id={'tab-panel-1'} aria-controls={'tab-panel-1'} value={1} />
                <Tab label={'상세 로그'} id={'tab-panel-2'} aria-controls={'tab-panel-2'} value={2} />
              </Tabs>
              
              <TabPanel value={tabState} index={1}>
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    {selectedDeviceId !== null 
                      ? `디스플레이 정보 그래프 (Device ${selectedDeviceId})`
                      : '디스플레이 정보 그래프 - Select a device to view data'}
                    {startDate && endDate && selectedDeviceId !== null && (
                      <Typography variant="subtitle2" color="text.secondary">
                        {`날짜 범위: ${startDate.format('YYYY-MM-DD')} ~ ${endDate.format('YYYY-MM-DD')}`}
                      </Typography>
                    )}
                  </Typography>
                  
                  {isDisplayLoading ? (
                    <Typography>Loading data...</Typography>
                  ) : selectedDeviceId === null ? (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      p: 4,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No device selected
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        아래 그리드에서 장치를 선택하여 해당 데이터를 확인하세요.
                      </Typography>
                    </Box>
                  ) : filteredGridData.length > 0 ? (
                    <Chart
                      data={filteredGridData}
                      tooltipContent={({ active, payload, label }) => {
                      const receive_date = dayjs(label).format('YYYY-MM-DD HH:mm:ss');
                      const voltR = Number(payload?.find(item => item.dataKey === 'voltR')?.value ?? 0);
                      const voltG = Number(payload?.find(item => item.dataKey === 'voltG')?.value ?? 0);
                      const currR = Math.floor(Number(payload?.find(item => item.dataKey === 'currR')?.value ?? 0)) / 1000;
                      const currG = Math.floor(Number(payload?.find(item => item.dataKey === 'currG')?.value ?? 0)) / 1000;
                      const wattR = Math.round(voltR * currR * 100) / 100;
                      const wattG = Math.round(voltG * currG * 100) / 100;

                      return (
                        <>
                          {active && payload && payload.length && (
                            <Paper sx={{ px: 2, py: 1, backgroundColor: '#202123' }}>
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
                                    {String(item.dataKey) === 'currR' && (
                                      <Typography color={item.color} fontWeight={'bold'}>
                                        {`${item.name}: ${currR.toFixed(2)}A (${wattR}W)`}
                                      </Typography>
                                    )}
                                    {String(item.dataKey) === 'currG' && (
                                      <Typography color={item.color} fontWeight={'bold'}>
                                        {`${item.name}: ${currG.toFixed(2)}A (${wattG}W)`}
                                      </Typography>
                                    )}
                                    {String(item.dataKey).startsWith('offCurr') && (
                                      <Typography color={item.color} fontWeight={'bold'}>
                                        {`${item.name}: ${item.value}mA`}
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
                        tickFormatter: value => `${Math.floor(value) / 1000}A`,
                        domain: [
                          0,
                          Math.max(
                            ...filteredGridData.map(item => 
                              Math.max(
                                item.current_red ?? 0, 
                                item.current_green ?? 0,
                                item.off_current_red ?? 0,
                                item.off_current_green ?? 0
                              )
                            )
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
                      { key: 'temp', name: '온도', color: '#ffd700', type: 'monotone', yAxisId: 'tempAxis' },
                      { key: 'voltR', name: '전압 R', color: '#ff6347', type: 'monotone', yAxisId: 'voltAxis' },
                      { key: 'voltG', name: '전압 G', color: '#32cd32', type: 'monotone', yAxisId: 'voltAxis' },
                      { key: 'currR', name: '전류 R', color: '#ff4500', type: 'monotone', yAxisId: 'currAxis' },
                      { key: 'currG', name: '전류 G', color: '#228b22', type: 'monotone', yAxisId: 'currAxis' },
                      { key: 'offCurrR', name: 'Off 전류 R', color: '#e9967a', type: 'monotone', yAxisId: 'currAxis' },
                      { key: 'offCurrG', name: 'Off 전류 G', color: '#20b2aa', type: 'monotone', yAxisId: 'currAxis' },
                    ]} />
                ) : (
                  <Typography>No data to display.</Typography>
                )}
              </TabPanel>
              
              <TabPanel value={tabState} index={2}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                  Display Details
                </Typography>
                {isDisplayLoading ? (
                  <Typography>Loading data...</Typography>
                ) : gridData.length > 0 ? (
                  <DataGrid
                    columns={displayInfoCols}
                    rows={gridData}
                    sortModel={[{ field: 'receive_date', sort: 'desc' }]}
                    pageSizeOptions={[100]}
                    localeText={{
                      noRowsLabel: 'No display information available.',
                    }} />
                ) : (
                  <Typography>No display information available.</Typography>
                )}
              </TabPanel>
            </Grid>
          </Grid>
        </Container>

        {/* Device Grid Panel */}
        <Container
          maxWidth={false}
          sx={{
            mt: 5,
            p: 2,
            backgroundColor: '#1c1c1c',
            borderRadius: 1,
            borderTop: '1px solid rgb(5, 4, 4)'
          }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            장치 상태 그리드 {selectedDeviceId !== null && `(Selected device: ${selectedDeviceId})`}
          </Typography>
          <Grid container spacing={1} sx={{ justifyContent: 'center' }}>
            {Array.from({ length: 64 }).map((_, index) => {
              const deviceId = index;
              const isActive = activeDeviceIds.has(deviceId);
              const deviceStatus = getDeviceStatus(deviceId);
              const hasWarning = deviceStatus && deviceStatus.warningLevel !== 'none';
              const isSelected = selectedDeviceId === deviceId;

              // Find the latest data time for this device
              // Determine device button color logic
              const deviceRows = gridData.filter(item => Number(item.deviceid) === deviceId);
              let isDisconnected = false;
              let isEmpty = false;
              if (deviceRows.length === 0) {
                isEmpty = true;
              } else {
                const latest = Math.max(...deviceRows.map(item => new Date(item.receive_date).getTime()));
                const now = Date.now();
                if (now - latest > 12 * 60 * 60 * 1000) {
                  isDisconnected = true;
                }
              }

              return (
  <Grid item key={index} xs={3} sm={2} md={1.5} lg={1}>
    <Tooltip
      title={
        deviceStatus ? (
          <Paper
            sx={{
              px: 1,
              py: 0.5,
              backgroundColor: 'black',
              color: 'white',
            }}
          >
            <Typography variant="body2" sx={{ color: 'white' }}>
              Device: {deviceStatus.deviceid}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              Avg Red: {deviceStatus.avgCurrentRed.toFixed(2)}mA
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              Avg Green: {deviceStatus.avgCurrentGreen.toFixed(2)}mA
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: hasWarning ? 'red' : 'lightgreen' }}
            >
              {deviceStatus.warningMessage}
            </Typography>
          </Paper>
        ) : (
          <Typography variant="body2" sx={{ color: 'white' }}>
            No data available
          </Typography>
        )
      }
      placement="top"
      arrow
    >
                    <Box
                      onClick={() => handleDeviceClick(deviceId)}
                      sx={{
                        position: 'relative',
                        width: '90%',
                        height: '50px',
                        aspectRatio: '1/1',
                        bgcolor: isEmpty ? 'common.white' : (isDisconnected ? 'grey.500' : (isActive ? 'transparent' : 'grey.300')),
                        border: '2px solid',
                        borderColor: isSelected ? 'primary.main' : 'grey.400',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        opacity: isDisconnected ? 0.5 : 1,
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'scale(1.05)',
                          transition: 'all 0.2s'
                        }
                      }}>
                      {isActive && !isDisconnected && !isEmpty ? (
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
                                fontSize: '3rem',
                                filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
                                zIndex: 2
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: isEmpty ? 'grey.400' : 'grey.600',
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
