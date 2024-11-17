import PropTypes from 'prop-types';
import { memo, forwardRef } from 'react';
import { StyledScrollbar, StyledRootScrollbar } from './styles';

const Scrollbar = forwardRef(({ children, sx, ...other }, ref) => {
  const userAgent = typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;

  return (
    <StyledRootScrollbar>
      <StyledScrollbar

        clickOnTrack={false}
        sx={sx}
        {...other}
      >
        {children}
      </StyledScrollbar>
    </StyledRootScrollbar>
  );
});

Scrollbar.propTypes = {
  children: PropTypes.node,
  sx: PropTypes.object,
};

export default memo(Scrollbar);
