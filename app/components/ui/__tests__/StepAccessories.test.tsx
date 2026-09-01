import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StepAccessories } from '../StepAccessories';
import { defaultTheme } from '@/app/lib/themes';
import {
  CUTTER_ID,
  DEFAULT_EQUIPMENT_IDS,
  VAROMA_ID,
} from '@/app/lib/equipment';

const renderPanel = (
  overrides: Partial<React.ComponentProps<typeof StepAccessories>> = {},
) => {
  const onConfigure = jest.fn();

  render(
    <StepAccessories
      accessories={[]}
      ownedEquipment={DEFAULT_EQUIPMENT_IDS}
      isTimerRunning={false}
      onConfigure={onConfigure}
      theme={defaultTheme}
      t={(dark: string) => dark}
      {...overrides}
    />,
  );

  return { onConfigure };
};

describe('StepAccessories', () => {
  it('ne rend rien quand l’étape ne demande aucun accessoire', () => {
    const { container } = render(
      <StepAccessories
        accessories={[]}
        ownedEquipment={DEFAULT_EQUIPMENT_IDS}
        isTimerRunning={false}
        onConfigure={jest.fn()}
        theme={defaultTheme}
        t={(dark: string) => dark}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('affiche le panneau Varoma avec ses rappels', () => {
    renderPanel({ accessories: [{ id: VAROMA_ID }] });

    expect(screen.getByText('Varoma')).toBeInTheDocument();
    expect(screen.getByText('Cuisson vapeur')).toBeInTheDocument();
    expect(screen.getByText(/une seule couche/i)).toBeInTheDocument();
  });

  it('affiche les 4 modes de coupe et met en avant celui de l’étape', () => {
    renderPanel({
      accessories: [{ id: CUTTER_ID, cutterMode: 'rape-fin' }],
      ownedEquipment: [...DEFAULT_EQUIPMENT_IDS, CUTTER_ID],
    });

    expect(screen.getByText('Tranches fines')).toBeInTheDocument();
    expect(screen.getByText('Tranches épaisses')).toBeInTheDocument();
    expect(screen.getByText('Râpé fin')).toBeInTheDocument();
    expect(screen.getByText('Râpé épais')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /Râpé fin/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /Tranches fines/ }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('laisse choisir un autre mode quand la recette ne le précise pas', () => {
    renderPanel({
      accessories: [{ id: CUTTER_ID }],
      ownedEquipment: [...DEFAULT_EQUIPMENT_IDS, CUTTER_ID],
    });

    expect(screen.getByText('Mode non précisé')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Tranches épaisses/ }));

    expect(
      screen.getByRole('button', { name: /Tranches épaisses/ }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('alerte et renvoie vers la configuration si le matériel n’est pas possédé', () => {
    const { onConfigure } = renderPanel({
      accessories: [{ id: CUTTER_ID }],
      ownedEquipment: DEFAULT_EQUIPMENT_IDS, // sans Découpe-minute
    });

    expect(
      screen.getByText(/Découpe-minute absent de votre matériel/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Configurer' }));
    expect(onConfigure).toHaveBeenCalled();
  });

  it('rend les accessoires simples sous forme de pastilles', () => {
    renderPanel({ accessories: [{ id: 'fouet' }, { id: 'panier-cuisson' }] });

    expect(
      screen.getByRole('button', { name: /Fouet \(papillon\)/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Panier de cuisson/ }),
    ).toBeInTheDocument();
  });
});
