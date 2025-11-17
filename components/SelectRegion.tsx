import { Box, Grid } from '@mui/material';
import Select from './Select';
import regions from '../lib/regions';
import { useCallback, useState } from 'react';
import { useMap } from 'react-kakao-maps-sdk';
import { addressSearch } from '../lib/utils';

type ProvinceType = keyof typeof regions;

type Props = {
  province: string;
  district: string;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
};

const SelectRegion = ({ province, district, ...props }: Props) => {
  // Safely get districts based on province
  const districts =
    province && (regions as any)[province as ProvinceType]
      ? (regions as any)[province as ProvinceType]
      : [];

  return (
    <Grid container spacing={1}>
      {/* Province */}
      <Grid item sx={{ width: 150 }}>
        <Select
          options={Object.keys(regions).map(p => ({
            label: p,
            value: p,
          }))}
          label="시/도"
          selectedValue={province}
          onChange={props.onProvinceChange}
        />
      </Grid>

      {/* District */}
      <Grid item sx={{ width: 150 }}>
        {districts.length > 0 && (
          <Select
            options={districts.map((d: string) => ({
              label: d,
              value: d,
            }))}
            label="시/군/구"
            selectedValue={district}
            onChange={props.onDistrictChange}
          />
        )}
      </Grid>
    </Grid>
  );
};

//
// SelectRegionOnMap
//
type SelectRegionOnMapProps = {
  province?: string;
  district?: string;
};

export const SelectRegionOnMap = ({ province: pProp, district: dProp }: SelectRegionOnMapProps) => {
  const map = useMap();

  const [province, setProvince] = useState(pProp ?? '');
  const [district, setDistrict] = useState(dProp ?? '');

  const moveToCenter = useCallback(
    async (addr: string) => {
      const newCenter = await addressSearch(addr);
      map.setCenter(newCenter);
      map.setLevel(3);
    },
    [map]
  );

  const handleProvinceChange = (value: string) => {
    if (value !== province) {
      setProvince(value);
      setDistrict('');
      moveToCenter(value);
    }
  };

  const handleDistrictChange = (value: string) => {
    if (value !== district) {
      setDistrict(value);
      moveToCenter(`${province} ${value}`);
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 5,
        left: 5,
        zIndex: 10,
      }}
    >
      <SelectRegion
        province={pProp ?? province}
        district={dProp ?? district}
        onProvinceChange={handleProvinceChange}
        onDistrictChange={handleDistrictChange}
      />
    </Box>
  );
};

export default SelectRegion;
