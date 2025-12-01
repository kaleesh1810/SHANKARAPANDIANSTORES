import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MenuOutlined, 
  LogoutOutlined, 
  CloseOutlined,
  HomeOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  UserOutlined,
  ShopOutlined,
  TeamOutlined,
  BuildOutlined,
  DatabaseOutlined,
  DollarOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';
import { Button, Dropdown, Space, Modal } from 'antd';
import DropdownMenu from './DropdownMenu';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [mobileMenuState, setMobileMenuState] = useState({
    masters: false,
    transactions: false
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      document.body.classList.remove('mobile-menu-open');
    };
  }, []);

  // Handle body scroll when mobile menu opens
  useEffect(() => {
    if (isMobile && isMenuOpen) {
      document.body.classList.add('mobile-menu-open');
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      document.body.classList.remove('mobile-menu-open');
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMobile, isMenuOpen]);

  const masterItems = [
    { name: 'Ledger Group Creation', path: '/masters/ledger-group-creation', icon: <AppstoreOutlined /> },
    { name: 'Ledger Creation', path: '/masters/ledger-creation', icon: <DatabaseOutlined /> },
    { name: 'Item Group Creation', path: '/masters/item-group-creation', icon: <ShopOutlined /> },
    { name: 'Item Creation', path: '/masters/item-creation', icon: <BuildOutlined /> },
    { name: 'Unit Creation', path: '/masters/unit-creation', icon: <TeamOutlined /> },
    { name: 'Salesman Creation', path: '/masters/salesman-creation', icon: <UserOutlined /> },
    { name: 'Company Creation', path: '/masters/company-creation', icon: <BuildOutlined /> }
  ];

  const transactionItems = [
    { name: 'Sales Invoice', path: '/transactions/sales-invoice', icon: <FileTextOutlined /> },
    { name: 'Purchase Invoice', path: '/transactions/purchase-invoice', icon: <DollarOutlined /> },
    { name: 'Sales Return', path: '/transactions/sales-return', icon: <FileTextOutlined /> },
    { name: 'Purchase Return', path: '/transactions/purchase-return', icon: <DollarOutlined /> }
  ];

  // Desktop hover handlers
  const handleMouseEnter = (menu) => {
    if (!isMobile) {
      setActiveDropdown(menu);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setActiveDropdown(null);
    }
  };

  // Desktop click handler (for closing other dropdown when one opens)
  const handleDropdownClick = (menu) => {
    if (!isMobile) {
      if (activeDropdown === menu) {
        setActiveDropdown(null);
      } else {
        setActiveDropdown(menu);
      }
    }
  };

  // Mobile menu toggle handlers
  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setMobileMenuState({ masters: false, transactions: false });
  };

  const toggleMobileDropdown = (menu) => {
    setMobileMenuState(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const handleLogout = () => {
    console.log('Logging out...');
    navigate('/login');
    setLogoutModalOpen(false);
    closeMobileMenu();
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit?')) {
      window.close();
    }
  };

  const showLogoutConfirm = () => {
    setLogoutModalOpen(true);
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles['nav-container']}>
          {/* Left: Logo */}
          <Link to="/" className={styles['nav-logo']} onClick={closeMobileMenu}>
            <span className={styles['logo-text']}>Shankarapandian</span>
            <span className={styles['logo-subtext']}>Stores</span>
          </Link>

          {/* Center: Navigation Menu (Desktop) */}
          {!isMobile && (
            <div className={styles['nav-center-menu']}>
              <div className={styles['nav-menu']}>
                <Link 
                  to="/" 
                  className={`${styles['nav-link']} ${location.pathname === '/' ? styles.active : ''}`}
                >
                  <HomeOutlined /> Home
                </Link>

                {/* Masters Dropdown - Click to open/close */}
                <div 
                  className={`${styles['nav-item']} ${styles.dropdown}`}
                  onMouseEnter={() => handleMouseEnter('masters')}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleDropdownClick('masters')}
                >
                  <button className={`${styles['nav-link']} ${styles['dropdown-toggle']} ${activeDropdown === 'masters' || location.pathname.includes('/masters') ? styles.active : ''}`}>
                    <AppstoreOutlined /> Masters
                    <span className={styles['arrow-icon']}>
                      {activeDropdown === 'masters' ? <UpOutlined /> : <DownOutlined />}
                    </span>
                  </button>
                  {activeDropdown === 'masters' && (
                    <div className={styles['dropdown-container']}>
                      <DropdownMenu 
                        items={masterItems} 
                        onItemClick={() => setActiveDropdown(null)}
                        position="center"
                      />
                    </div>
                  )}
                </div>

                {/* Transactions Dropdown - Click to open/close */}
                <div 
                  className={`${styles['nav-item']} ${styles.dropdown}`}
                  onMouseEnter={() => handleMouseEnter('transactions')}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleDropdownClick('transactions')}
                >
                  <button className={`${styles['nav-link']} ${styles['dropdown-toggle']} ${activeDropdown === 'transactions' || location.pathname.includes('/transactions') ? styles.active : ''}`}>
                    <FileTextOutlined /> Transactions
                    <span className={styles['arrow-icon']}>
                      {activeDropdown === 'transactions' ? <UpOutlined /> : <DownOutlined />}
                    </span>
                  </button>
                  {activeDropdown === 'transactions' && (
                    <div className={styles['dropdown-container']}>
                      <DropdownMenu 
                        items={transactionItems} 
                        onItemClick={() => setActiveDropdown(null)}
                        position="center"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right: Actions */}
          <div className={styles['nav-actions']}>
            {isMobile ? (
              <Button
                type="text"
                icon={isMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
                onClick={toggleMobileMenu}
                className={styles['menu-toggle']}
              />
            ) : (
              <Space className={styles['action-buttons']}>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'logout',
                        label: 'Logout',
                        icon: <LogoutOutlined />,
                        onClick: showLogoutConfirm,
                      },
                      {
                        key: 'exit',
                        label: 'Exit',
                        icon: <CloseOutlined />,
                        onClick: handleExit,
                      },
                    ],
                  }}
                  placement="bottomRight"
                >
                  <Button type="text" icon={<UserOutlined />} className={styles['user-menu']}>
                    Admin
                  </Button>
                </Dropdown>
              </Space>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
       {/* Mobile Menu Overlay */}
{isMobile && isMenuOpen && (
  <div 
    className={styles['mobile-menu-overlay']}
    onClick={closeMobileMenu}
  >
    <div 
      className={styles['mobile-menu']}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles['mobile-menu-header']}>
        <Link to="/" onClick={closeMobileMenu} className={styles['nav-logo']}>
          <span className={styles['logo-text']}>Shankarapandian</span>
          <span className={styles['logo-subtext']}>Stores</span>
        </Link>
        <Button 
          type="text" 
          icon={<CloseOutlined />} 
          onClick={closeMobileMenu}
          className={styles['close-menu-btn']}
        />
      </div>
      
      <div className={styles['mobile-menu-content']}>
        <div className={styles['mobile-menu-items']}>
          <Link 
            to="/" 
            className={`${styles['mobile-link']} ${location.pathname === '/' ? styles.active : ''}`}
            onClick={closeMobileMenu}
          >
            <HomeOutlined /> Home
          </Link>
          
          {/* Masters Accordion */}
          <div className={styles['mobile-dropdown-accordion']}>
            <div 
              className={`${styles['mobile-dropdown-header']} ${mobileMenuState.masters ? styles.active : ''}`}
              onClick={() => toggleMobileDropdown('masters')}
            >
              <div className={styles['header-content']}>
                <AppstoreOutlined /> Masters
              </div>
              <span className={styles['arrow-icon']}>
                {mobileMenuState.masters ? <UpOutlined /> : <DownOutlined />}
              </span>
            </div>
            <div className={`${styles['mobile-dropdown-items']} ${mobileMenuState.masters ? styles.open : ''}`}>
              {masterItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${styles['mobile-dropdown-item']} ${location.pathname === item.path ? styles.active : ''}`}
                  onClick={closeMobileMenu}
                >
                  {item.icon} {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Transactions Accordion */}
          <div className={styles['mobile-dropdown-accordion']}>
            <div 
              className={`${styles['mobile-dropdown-header']} ${mobileMenuState.transactions ? styles.active : ''}`}
              onClick={() => toggleMobileDropdown('transactions')}
            >
              <div className={styles['header-content']}>
                <FileTextOutlined /> Transactions
              </div>
              <span className={styles['arrow-icon']}>
                {mobileMenuState.transactions ? <UpOutlined /> : <DownOutlined />}
              </span>
            </div>
            <div className={`${styles['mobile-dropdown-items']} ${mobileMenuState.transactions ? styles.open : ''}`}>
              {transactionItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${styles['mobile-dropdown-item']} ${location.pathname === item.path ? styles.active : ''}`}
                  onClick={closeMobileMenu}
                >
                  {item.icon} {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer with side-by-side buttons */}
        <div className={styles['mobile-menu-footer']}>
          <div className={styles['mobile-action-buttons']}>
            <Button 
              icon={<LogoutOutlined />} 
              onClick={() => {
                closeMobileMenu();
                showLogoutConfirm();
              }}
              className={styles['mobile-logout-btn']}
            >
              Logout
            </Button>
            <Button 
              icon={<CloseOutlined />} 
              onClick={() => {
                closeMobileMenu();
                handleExit();
              }}
              className={styles['mobile-exit-btn']}
            >
              Exit
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      </nav>

      {/* Logout Confirmation Modal */}
      <Modal
        title="Confirm Logout"
        open={logoutModalOpen}
        onOk={handleLogout}
        onCancel={() => setLogoutModalOpen(false)}
        okText="Logout"
        cancelText="Cancel"
        okButtonProps={{ danger: true, icon: <LogoutOutlined /> }}
      >
        <p>Are you sure you want to logout?</p>
      </Modal>
    </>
  );
};

export default Navbar;