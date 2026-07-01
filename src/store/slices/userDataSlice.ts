import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { baseUrl } from "@/config";

export const fetchUserData = createAsyncThunk(
  "userData/fetchUserData",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${baseUrl.currentStaff}`);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Something went wrong"
      );
    }
  }
);

interface UserDataState {
  data: any;
  loading: boolean;
  error: string | null;
  isFetched: boolean;
}

const initialState: UserDataState = {
  data: null,
  loading: false,
  error: null,
  isFetched: false,
};

const userDataSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    clearUserData: (state) => {
      state.data = null;
      state.isFetched = false;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("currentUser");
      }
    },
    setUserData: (state, action) => {
      const userData = action.payload?.data || action.payload;
      state.data = userData;
      state.isFetched = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(userData));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        const userData = action.payload?.data || action.payload;
        state.data = userData;
        state.isFetched = true;
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUser", JSON.stringify(userData));
        }
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isFetched = true;
      });
  },
});

export const { clearUserData, setUserData } = userDataSlice.actions;
export default userDataSlice.reducer;