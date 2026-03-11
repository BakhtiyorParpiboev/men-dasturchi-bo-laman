import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 72px)',
            padding: '2rem',
            textAlign: 'center',
            gap: '1rem'
        }}>
            <div style={{ fontSize: '5rem' }}>🚧</div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>404</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '400px' }}>
                Bu sahifa topilmadi. Sahifa o'chirilgan yoki manzil noto'g'ri kiritilgan bo'lishi mumkin.
            </p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Bosh Sahifaga Qaytish
            </Link>
        </div>
    );
};

export default NotFound;
