'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchOrgs } from '@/lib/api';

interface OrgContextType {
    selectedOrg: string;
    setSelectedOrg: (org: string) => void;
    availableOrgs: string[];
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedOrg, setSelectedOrg] = useState('acme-corp');
    const [availableOrgs, setAvailableOrgs] = useState<string[]>(['acme-corp']);

    useEffect(() => {
        fetchOrgs().then(orgs => {
            if (orgs && orgs.length > 0) {
                setAvailableOrgs(orgs);
                // Optionally set first org as default if current one isn't in the list
                if (!orgs.includes(selectedOrg)) {
                    setSelectedOrg(orgs[0]);
                }
            }
        });
    }, []);

    return (
        <OrgContext.Provider value={{ selectedOrg, setSelectedOrg, availableOrgs }}>
            {children}
        </OrgContext.Provider>
    );
};

export const useOrg = () => {
    const context = useContext(OrgContext);
    if (context === undefined) {
        throw new Error('useOrg must be used within an OrgProvider');
    }
    return context;
};
