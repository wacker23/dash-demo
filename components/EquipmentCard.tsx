import { animated, useSpring } from '@react-spring/web';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import { useEquipmentInfo } from '../lib/useAPI'
import dayjs from 'dayjs';
import { useDrag } from '@use-gesture/react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useState } from 'react';
import { useRouter } from 'next/router';

type Props = {
  id: string;
};

const EquipmentCard = (props: Props) => {
  const router = useRouter();
  const { device, isLoading } = useEquipmentInfo(props.id);
  const [showActions, setShowActions] = useState(false);
  const [{x: dragX}, setDragX] = useSpring(() => ({
    x: 0,
  }));

  const bind = useDrag((state) => {
    const {movement: [mx]} = state;
    if (state.last) {
      if (mx < -60) {
        setDragX({ x: -60 });
        setShowActions(true);
      } else {
        setShowActions(false);
      }
    } else {
      setDragX({ x: mx > 0 ? 0 : mx });
    }
  });

  if (isLoading) {
    return null;
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {device && (
        <>
          <animated.div
            {...bind()}
            style={{
              transform: dragX.to((x) => `translate3d(${x}px, 0, 0)`),
            }}>
            <Paper elevation={3} sx={{px: 1.5, py: 1}}>
              <Typography variant={'h5'}>
                {`${device.equipment_type}-${device.id}`}
              </Typography>
              <Divider />
              <Typography>
                {`메시지 발송 간격 시간: ${device.interval}s`}
              </Typography>
              <Typography>
                {`모뎀 ID: ${device.modem_id && device.modem_id.trim() !== '' ? device.modem_id : '메모 없음'}`}
              </Typography>
              <Typography>
                {`메모: ${device.memo && device.memo.trim() !== '' ? device.memo : '메모 없음'}`}
              </Typography>
              <Typography>
                {`설치 장소: ${device.location.name}`}
              </Typography>
              <Typography>
                {`설치일: ${dayjs(device.manufacturing_date).format('YYYY년 MM월 DD일')}`}
              </Typography>
            </Paper>
          </animated.div>
          {showActions && (
            <Box sx={{
              display: 'flex',
              position: 'absolute',
              top: 0,
              right: 0,
              height: '100%',
            }}>
              <Button
                variant={'contained'}
                sx={{ ml: 'auto' }}
                onClick={() => router.push(`/console/device/edit/${device.equipment_type}${device.id}`)}>
                Edit
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default EquipmentCard;
