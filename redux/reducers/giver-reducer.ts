import { Giver } from '../../models/giver';

export interface GiverState {
  givers: Giver[];
  loading: boolean;
  error: string | null;
}

const initialState: GiverState = {
  givers: [],
  loading: false,
  error: null,
};

// Action types
export const GIVER_ACTIONS = {
  FETCH_REQUEST: 'GIVER_FETCH_REQUEST',
  FETCH_SUCCESS: 'GIVER_FETCH_SUCCESS',
  FETCH_FAILURE: 'GIVER_FETCH_FAILURE',
  CREATE: 'GIVER_CREATE',
  UPDATE: 'GIVER_UPDATE',
  DELETE: 'GIVER_DELETE',
};

export default function giverReducer(state = initialState, action: any): GiverState {
  switch (action.type) {
    case GIVER_ACTIONS.FETCH_REQUEST:
      return { ...state, loading: true, error: null };
    case GIVER_ACTIONS.FETCH_SUCCESS:
      return { ...state, loading: false, givers: action.payload };
    case GIVER_ACTIONS.FETCH_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case GIVER_ACTIONS.CREATE:
      return { ...state, givers: [...state.givers, action.payload] };
    case GIVER_ACTIONS.UPDATE:
      return {
        ...state,
        givers: state.givers.map(g => g.giverId === action.payload.giverId ? action.payload : g),
      };
    case GIVER_ACTIONS.DELETE:
      return { ...state, givers: state.givers.filter(g => g.giverId !== action.payload) };
    default:
      return state;
  }
}
