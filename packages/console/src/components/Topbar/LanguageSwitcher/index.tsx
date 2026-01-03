import classNames from 'classnames';
import { useRef, useState } from 'react';

import Globe from '@/assets/icons/globe.svg?react';
import Tick from '@/assets/icons/tick.svg?react';
import Dropdown, { DropdownItem } from '@/ds-components/Dropdown';
import useUserPreferences from '@/hooks/use-user-preferences';
import { onKeyDownHandler } from '@/utils/a11y';

import styles from './index.module.scss';

type Props = {
  readonly className?: string;
};

function LanguageSwitcher({ className }: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const {
    data: { language },
    update,
  } = useUserPreferences();

  const currentLabel = language === 'zh-CN' ? '中文' : 'EN';

  return (
    <>
      <div
        ref={anchorRef}
        role="button"
        tabIndex={0}
        className={classNames(styles.button, showDropdown && styles.active, className)}
        onKeyDown={onKeyDownHandler(() => {
          setShowDropdown(true);
        })}
        onClick={() => {
          setShowDropdown(true);
        }}
      >
        <Globe className={styles.icon} />
        <span className={styles.label}>{currentLabel}</span>
      </div>
      <Dropdown
        anchorRef={anchorRef}
        className={styles.dropdown}
        isOpen={showDropdown}
        horizontalAlign="end"
        onClose={() => {
          setShowDropdown(false);
        }}
      >
        <DropdownItem
          className={classNames(styles.dropdownItem, language === 'en' && styles.selected)}
          onClick={() => {
            void update({ language: 'en' });
            setShowDropdown(false);
          }}
        >
          {language === 'en' && <Tick className={styles.tick} />}
          <span className={styles.languageTitle}>English</span>
        </DropdownItem>
        <DropdownItem
          className={classNames(styles.dropdownItem, language === 'zh-CN' && styles.selected)}
          onClick={() => {
            void update({ language: 'zh-CN' });
            setShowDropdown(false);
          }}
        >
          {language === 'zh-CN' && <Tick className={styles.tick} />}
          <span className={styles.languageTitle}>简体中文</span>
        </DropdownItem>
      </Dropdown>
    </>
  );
}

export default LanguageSwitcher;
