import { NextPage } from "next";
import Layout from "../../../components/Layout";
import { useEffect, useState, useMemo } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import ActionButton from "../../../components/ActionButton";
import { useSearchAddr } from "../../../lib/useAPI";
import SelectRegion from "../../../components/SelectRegion";
import { styled } from '@mui/material/styles';
import { useApp } from '../../../lib/useApp';
import EquipmentDisplayDialog from "../../../components/EquipmentDisplayDialog";

const STATUS_COLOR = {
  normal: '#4fff4f',
  warn: '#ffa64e',
  emergency: '#ff4c4c',
  blank: '#fefefe'
};

interface GridItemProps {
  status: 'normal' | 'warn' | 'emergency' | 'blank';
}

const GridItem = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'status',
})<GridItemProps>(({ theme, status }) => ({
  ...theme.typography.body2,
  backgroundColor: STATUS_COLOR[status],
  textAlign: 'center',
  color: '#232323',
  fontWeight: 'bold',
  minWidth: 95,
  height: 40,
  lineHeight: '40px',
}));

// Status Legend Component - responsive: wraps on small screens and uses responsive sizes
const StatusLegend = () => {
  const items = [
    { color: STATUS_COLOR.normal, label: 'All right' },
    { color: STATUS_COLOR.warn, label: 'Timeout' },
    { color: STATUS_COLOR.emergency, label: 'No connection' },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 0.5, sm: 1 },
        flexWrap: 'wrap',
        justifyContent: { xs: 'flex-start', sm: 'center' },
      }}
    >
      {items.map((it, idx) => (
        <Box
          key={idx}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: { xs: '8px', sm: '10px' },
              height: { xs: '8px', sm: '10px' },
              backgroundColor: it.color,
              borderRadius: '2px',
              border: '1px solid #ccc',
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '11px', sm: '12px' },
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: { xs: 90, sm: 'auto' },
            }}
          >
            {it.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const Page: NextPage = () => {
  const app = useApp();
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const { searchData, loadPage: searchAddress } = useSearchAddr('');

  const [detailId, setDetailId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const address = app.getValue('address') || '';
    if (address) {
      setProvince(address.split(' ')[0]);
      setDistrict(address.split(' ').slice(1).join(' '));
    }
  }, [app]);

  useEffect(() => {
    if (province.trim() !== '' && district.trim() !== '') {
      searchAddress(`${province.trim()} ${district.trim()}`);
      app.setValue('address', `${province.trim()} ${district.trim()}`);
    }
  }, [province, district, searchAddress, app]);

  const groupedData = useMemo(() => {
    const groups: { [name: string]: { id: number, equipment_type: string, device_state: 'normal' | 'warn' | 'emergency' | 'blank' }[] } = {};
    if (!searchData.forEach) {
      return groups;
    }
    searchData.forEach(({ location, id, equipment_type, device_state }) => {
      if (!groups[location.name]) {
        groups[location.name] = [];
      }
      groups[location.name].push({ id, equipment_type, device_state });
    });
    return groups;
  }, [searchData]);

  const handleViewStatus = (id: number, type: string) => {
    setDetailId(`${type}${id}`);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setDetailId('');
  };

  return (
    <Layout title={"모듈 상태"} menuBar={[]}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
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
            }}
          />
          <StatusLegend />
        </Box>
        <Box sx={{ height: 'calc(100vh - 165px)' }}>
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
                  sx={{ width: 342, px: 2, py: 3 }}>
                  <Typography variant={'h5'}>{locationName}</Typography>
                  <Grid container spacing={1.5} sx={{ mt: .5 }}>
                    {items.map(({ id, equipment_type, device_state }) => (
                      <Grid key={`item-${equipment_type}-${id}`} item>
                        <ActionButton onClick={() => handleViewStatus(id, equipment_type)}>
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
      </Grid>
      <EquipmentDisplayDialog
        visible={isModalOpen}
        id={detailId}
        onClose={handleModalClose}
      />
    </Layout>
  );
};

export default Page;
