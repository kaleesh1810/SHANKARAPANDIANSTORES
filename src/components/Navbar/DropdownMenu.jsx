import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

const DropdownMenu = ({ items, onItemClick, position = 'center' }) => {
  return (
    <div className={`${styles['dropdown-menu']} ${styles[position]}`}>
      {items.map((item, index) => (
        <Link
          key={index}
          to={item.path}
          className={styles['dropdown-item']}
          onClick={onItemClick}
        >
          {item.icon && <span className={styles['dropdown-icon']}>{item.icon}</span>}
          {item.name}
        </Link>
      ))}
    </div>
  );
};

export default DropdownMenu;