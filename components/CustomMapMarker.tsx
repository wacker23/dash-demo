import {ButtonBase, IconButton, List, ListItem, ListItemText, Paper, Typography} from '@mui/material';
import {CustomOverlayMap, MapMarker, useMap} from 'react-kakao-maps-sdk';
import { useState } from 'react';
import NotesIcon from "@mui/icons-material/Notes";
import {EquipmentDto} from "../types/equipment.dto";

type Props = {
  name: string;
  alertLevel: 'normal' | 'warn' | 'emergency';
  lat: number;
  lng: number;
  equipments: EquipmentDto[];
  onViewStatus?: (id: number, type: string) => void;
};

export default function CustomMapMarker({
  alertLevel, lat, lng, equipments, ...props
}: Props) {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (equipment: EquipmentDto) => {
    props.onViewStatus && props.onViewStatus(equipment.id, equipment.equipment_type);
  };

  return (
    <>
      <MapMarker
        position={{lat, lng}}
        image={{
          src: `/marker/${alertLevel}.png`,
          size: {width: 30, height: 40},
        }}
        onClick={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div
          onMouseEnter={() => map.setZoomable(false)}
          onMouseLeave={() => map.setZoomable(true)}>
          <CustomOverlayMap
            position={{lat, lng}}
            yAnchor={equipments.length > 3 ? 1.27 : 1.32}>
            <Paper
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: 130,
                pt: 1,
                pl: 2,
              }}>
              <Typography fontWeight={'bold'}>
                {props.name}
              </Typography>
              <List
                dense={true}
                sx={{
                  maxHeight: 125,
                  overflowY: 'scroll',
                }}>
                {equipments.map(equipment => (
                  <ListItem
                    key={`${equipment.equipment_type}${equipment.id}`}
                    disablePadding
                    secondaryAction={
                      <IconButton onClick={() => handleClick(equipment)}>
                        <NotesIcon/>
                      </IconButton>
                    }>
                    <ListItemText
                      primary={`${equipment.equipment_type}${equipment.id}`}
                      secondary={null} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </CustomOverlayMap>
        </div>
      )}
      <CustomOverlayMap
        position={{lat, lng}}
        yAnchor={1.5}>
        <ButtonBase
          onClick={() => setIsOpen(!isOpen)}>
          <Typography fontWeight={'bold'}>
            {equipments.length}
          </Typography>
        </ButtonBase>
      </CustomOverlayMap>
    </>
  );
}
