import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../../api/authApi'

// Get user from localStorage (only user data, no token)
const storedUser = localStorage.getItem('user')
const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedUser, // if we have user, assume authenticated
  loading: false,
  error: null,
  role: storedUser ? JSON.parse(storedUser).role : null
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials)
      const { student } = response.data
      // Store user data in localStorage (not token)
      localStorage.setItem('user', JSON.stringify(student))
      return { user: student }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (credential, { rejectWithValue }) => {
    try {
      const response = await authApi.googleAuth(credential)
      const { student } = response.data
      localStorage.setItem('user', JSON.stringify(student))
      return { user: student }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Google login failed')
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout()
      localStorage.removeItem('user')
      return null
    } catch (error) {
      localStorage.removeItem('user')
      return rejectWithValue(error.response?.data?.message || 'Logout failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action) => {
      state.user = action.payload.user
      state.isAuthenticated = true
      state.role = action.payload.user.role
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.role = action.payload.user.role
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false
        // Usually you need to verify email, so don't set authenticated
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(googleLogin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.role = action.payload.user.role
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(logout.pending, (state) => {
        state.loading = true
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.role = null
        state.loading = false
      })
      .addCase(logout.rejected, (state, action) => {
        state.user = null
        state.isAuthenticated = false
        state.role = null
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError, setUser } = authSlice.actions
export default authSlice.reducer