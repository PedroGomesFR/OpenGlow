import { useState, useEffect } from 'react';
import { IoTrash, IoShieldCheckmark, IoPeople, IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import '../css/AppleDesign.css';

function AdminPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Security check
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            window.location.href = '/login';
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (!user.isAdmin) {
                alert("Accès refusé. Réservé aux administrateurs.");
                window.location.href = '/';
                return;
            }
            fetchUsers();
        } catch (e) {
            window.location.href = '/';
        }
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(window.API_URL + '/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                // If token invalid or not admin
                console.error('Access denied');
                // window.location.href = '/'; 
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setUsers(users.filter(u => u._id !== userId));
                alert('Utilisateur supprimé avec succès.');
            } else {
                alert('Erreur lors de la suppression.');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erreur lors de la suppression.');
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    const clients = users.filter(u => u.isClient);
    const professionals = users.filter(u => !u.isClient);

    return (
        <div style={{ background: '#F5F5F7', minHeight: '100vh', padding: '40px 20px' }}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                    <button onClick={() => navigate('/')} className="btn btn-outline" style={{ marginRight: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IoArrowBack /> Retour
                    </button>
                    <div>
                        <h1 style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <IoShieldCheckmark color="var(--primary)" /> Administration
                        </h1>
                        <p className="text-secondary">Monitorez et gérez les utilisateurs de la plateforme.</p>
                    </div>
                </div>

                <div className="grid grid-3" style={{ marginBottom: '40px' }}>
                    <div className="card">
                        <div className="text-secondary" style={{ fontSize: '12px', fontWeight: 'bold' }}>TOTAL UTILISATEURS</div>
                        <div style={{ fontSize: '32px', fontWeight: '700', margin: '10px 0' }}>{users.length}</div>
                        <IoPeople className="text-secondary" size={24} />
                    </div>
                    <div className="card">
                        <div className="text-secondary" style={{ fontSize: '12px', fontWeight: 'bold' }}>CLIENTS</div>
                        <div style={{ fontSize: '32px', fontWeight: '700', margin: '10px 0', color: 'var(--primary)' }}>{clients.length}</div>
                    </div>
                    <div className="card">
                        <div className="text-secondary" style={{ fontSize: '12px', fontWeight: 'bold' }}>PROFESSIONNELS</div>
                        <div style={{ fontSize: '32px', fontWeight: '700', margin: '10px 0', color: 'var(--primary)' }}>{professionals.length}</div>
                    </div>
                </div>

                <div className="card">
                    <h2 style={{ marginBottom: '20px' }}>Utilisateurs ({users.length})</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                                    <th style={{ padding: '12px', color: '#86868b', fontSize: '13px' }}>NOM / EMAIL</th>
                                    <th style={{ padding: '12px', color: '#86868b', fontSize: '13px' }}>ROLE</th>
                                    <th style={{ padding: '12px', color: '#86868b', fontSize: '13px' }}>ENTREPRISE</th>
                                    <th style={{ padding: '12px', color: '#86868b', fontSize: '13px' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                                        <td style={{ padding: '15px 12px' }}>
                                            <div style={{ fontWeight: '600' }}>{user.prenom} {user.nom}</div>
                                            <div style={{ fontSize: '12px', color: '#86868b' }}>{user.email}</div>
                                        </td>
                                        <td style={{ padding: '15px 12px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                background: user.isClient ? '#E5F9E7' : '#E5F1FF',
                                                color: user.isClient ? 'var(--primary)' : 'var(--primary-hover)'
                                            }}>
                                                {user?.isAdmin ? 'ADMIN' : user.isClient ? 'CLIENT' : 'PRO'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 12px', color: '#86868b' }}>
                                            {user.companyName || '-'}
                                        </td>
                                        <td style={{ padding: '15px 12px' }}>
                                            <button
                                                onClick={() => handleDeleteUser(user._id)}
                                                style={{
                                                    border: 'none',
                                                    background: '#FFE5E5',
                                                    color: 'var(--primary)',
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                title="Supprimer"
                                            >
                                                <IoTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPage;
