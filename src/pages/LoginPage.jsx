import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

export default function LoginPage({ onLogin, onGoogleSignIn, onSignUp }) {
  const [isSignUp, setIsSignUp] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: isSignUp
      ? Yup.string()
          .oneOf([Yup.ref('password'), null], 'Passwords must match')
          .required('Confirm Password is required')
      : Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: (values) => {
      if (isSignUp) {
        onSignUp(values.email, values.password);
      } else {
        onLogin(values.email, values.password);
      }
    },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-6">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
              className={`w-full px-4 py-3 mt-2 bg-gray-800 border-2 rounded-lg text-white focus:outline-none transition ${formik.touched.email && formik.errors.email ? 'border-red-500' : 'border-gray-700 focus:border-emerald-400'}`}
              placeholder="Email"
            />
            {formik.touched.email && formik.errors.email ? (
              <div className="absolute top-full mt-1 text-red-500 text-xs">{formik.errors.email}</div>
            ) : null}
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
              className={`w-full px-4 py-3 mt-2 bg-gray-800 border-2 rounded-lg text-white focus:outline-none transition ${formik.touched.password && formik.errors.password ? 'border-red-500' : 'border-gray-700 focus:border-emerald-400'}`}
              placeholder="Password"
            />
            {formik.touched.password && formik.errors.password ? (
              <div className="absolute top-full mt-1 text-red-500 text-xs">{formik.errors.password}</div>
            ) : null}
          </div>
          {isSignUp && (
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
                className={`w-full px-4 py-3 mt-2 bg-gray-800 border-2 rounded-lg text-white focus:outline-none transition ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-red-500' : 'border-gray-700 focus:border-emerald-400'}`}
                placeholder="Confirm Password"
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                <div className="absolute top-full mt-1 text-red-500 text-xs">{formik.errors.confirmPassword}</div>
              ) : null}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 font-bold text-white bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-lg hover:from-emerald-600 hover:to-cyan-700 transition-transform transform hover:scale-105 shadow-lg"
            disabled={!formik.isValid || !formik.dirty}
          >
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => {
            setIsSignUp(!isSignUp);
            formik.resetForm();
          }} className="text-sm text-gray-400 hover:text-white">
            {isSignUp ? 'Already have an account? Login' : "Don\'\'\'t have an account? Sign Up"}
          </button>
        </div>
        <div className="my-6 flex items-center">
          <div className="flex-grow bg-gray-700 h-px"></div>
          <span className="mx-4 text-sm font-medium text-gray-500">OR</span>
          <div className="flex-grow bg-gray-700 h-px"></div>
        </div>
        <button
          onClick={onGoogleSignIn}
          className="w-full py-3 font-bold text-white bg-slate-800 rounded-lg transition-transform transform hover:scale-105 shadow-lg flex items-center justify-center"
        >
          <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.494 44 31.886 44 26c0-1.341-.138-2.65-.389-3.917z"></path>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
