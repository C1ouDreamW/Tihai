import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 页面组件
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Category from '../pages/Category';
import Study from '../pages/Study';
import CardMode from '../pages/CardMode';
import Stats from '../pages/Stats';
import Profile from '../pages/Profile';
import ImportQuestions from '../pages/ImportQuestions';
import NotFound from '../pages/NotFound';

// 布局组件
import Layout from '../components/Layout';

// 路由配置
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 带有导航栏的路由 */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="category/:id" element={<Category />} />
          <Route path="study/:mode/:categoryId" element={<Study />} />
          <Route path="card/:categoryId" element={<CardMode />} />
          <Route path="stats" element={<Stats />} />
          <Route path="profile" element={<Profile />} />
          <Route path="import" element={<ImportQuestions />} />
        </Route>

        {/* 独立路由 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 404页面 */}
        <Route path="*" element={<NotFound />} />

        {/* 重定向 */}
        <Route path="/home" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
