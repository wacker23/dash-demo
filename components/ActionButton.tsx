import { Box, ButtonBase } from '@mui/material';
import { useState } from 'react';
import Fab from '@mui/material/Fab';

interface ActionButtonProps {
  onClick?: () => void;
  children?: JSX.Element | JSX.Element[];
  renderAction?: () => JSX.Element;
}

const ActionButton = (props: ActionButtonProps) => {
  const {
    onClick,
    children,
    renderAction,
  } = props;
  const [hover, setHover] = useState(false);

  return (
    <Box
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}>
      <ButtonBase
        onClick={onClick}>
        {children}
      </ButtonBase>
      {(hover && renderAction) && renderAction()}
    </Box>
  );
}

export default ActionButton
