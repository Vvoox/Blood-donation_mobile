import { BloodRequest } from '../../models/blood-request';

export const REQUEST_ACTIONS = {
  FETCH_REQUEST: 'REQUEST_FETCH_REQUEST',
  FETCH_SUCCESS: 'REQUEST_FETCH_SUCCESS',
  FETCH_FAILURE: 'REQUEST_FETCH_FAILURE',
  CREATE: 'REQUEST_CREATE',
  UPDATE: 'REQUEST_UPDATE',
  SET_CITY_FILTER: 'REQUEST_SET_CITY_FILTER',
};

export interface RequestState {
  requests: BloodRequest[];
  cityFilter: string;
  loading: boolean;
  error: string | null;
}

const initialState: RequestState = {
  requests: [],
  cityFilter: '',
  loading: false,
  error: null,
};

export default function requestReducer(state = initialState, action: any): RequestState {
  switch (action.type) {
    case REQUEST_ACTIONS.FETCH_REQUEST:
      return { ...state, loading: true, error: null };
    case REQUEST_ACTIONS.FETCH_SUCCESS:
      return { ...state, loading: false, requests: action.payload };
    case REQUEST_ACTIONS.FETCH_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case REQUEST_ACTIONS.CREATE:
      return { ...state, requests: [action.payload, ...state.requests] };
    case REQUEST_ACTIONS.UPDATE:
      return {
        ...state,
        requests: state.requests.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case REQUEST_ACTIONS.SET_CITY_FILTER:
      return { ...state, cityFilter: action.payload };
    default:
      return state;
  }
}
