'use client';

export default function NotFoundPage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh' 
    }}>
      <h1>404 - Page Not Found</h1>
      <p>요청하신 페이지를 찾을 수 없습니다.</p>
    </div>
  );
}
