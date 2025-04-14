import { useState } from "react";
import { useForm } from "react-hook-form";
import { registerUser } from "./authService";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    const response = await registerUser(data.email, data.password, data.fullName);
    if (response.success) {
      navigate("/login");
    } else {
      setError(response.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input {...register("fullName", { required: true })} type="text" placeholder="Full Name" className="w-full p-3 border rounded"/>
          {errors.fullName && <p className="text-red-500">Full Name is required</p>}
          
          <input {...register("email", { required: true })} type="email" placeholder="Email" className="w-full p-3 border rounded"/>
          {errors.email && <p className="text-red-500">Email is required</p>}
          
          <input {...register("password", { required: true, minLength: 6 })} type="password" placeholder="Password" className="w-full p-3 border rounded"/>
          {errors.password && <p className="text-red-500">Password must be at least 6 characters</p>}
          
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700">Sign Up</button>
        </form>
        <p className="mt-4 text-center">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
