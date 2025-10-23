// Utility per formattare le date in italiano
export const formatItalianDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formattedDate = dateObj.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Rome'
  });
  
  const formattedTime = dateObj.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome'
  });
  
  return `${formattedDate}, ore ${formattedTime}`;
};

export const formatItalianDateShort = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome'
  });
};

export const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'in_attesa': 'In Attesa',
    'attiva': 'Attiva',
    'in_pausa': 'In Pausa',
    'risolta': 'Risolta',
    'cancellata': 'Cancellata'
  };
  
  return statusMap[status] || status;
};

export const getClosingDateText = (closingDate: string | Date, status?: string): string => {
  const dateObj = typeof closingDate === 'string' ? new Date(closingDate) : closingDate;
  
  // Rispetta SOLO lo status del database, non controllare la data
  if (status === 'risolta') {
    return 'Risolta';
  }
  
  if (status === 'cancellata') {
    return 'Cancellata';
  }
  
  if (status === 'in_pausa') {
    return 'In Pausa';
  }
  
  if (status === 'in_attesa') {
    return 'In Attesa';
  }
  
  // Per status "attiva", non mostrare nulla
  if (status === 'attiva') {
    return '';
  }
  
  // Per qualsiasi altro status, mostra solo la data formattata
  const formattedDate = formatItalianDate(dateObj);
  return formattedDate;
};
