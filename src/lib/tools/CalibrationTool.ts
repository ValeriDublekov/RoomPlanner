import { ToolHandler } from './types';
import { getDistance } from '../geometry';

export const CalibrationTool: ToolHandler = {
  onClick: (e, { state, getSnappedMousePos }) => {
    const relPos = getSnappedMousePos();
    const { calibrationPoints, setCalibrationPoints, setTempCalibrationDist } = state;
    
    if (!calibrationPoints) {
      setCalibrationPoints([relPos]);
    } else if (calibrationPoints.length === 1) {
      const p1 = calibrationPoints[0];
      const dist = getDistance(p1, relPos);
      setTempCalibrationDist(dist);
      setCalibrationPoints(null);
    }
  }
};
