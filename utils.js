export const pluralize = (n, forms) => {
    // 5-20 always use forms[2]
    if (n % 100 >= 5 && n % 100 <= 20) return forms[2];
    // 1 uses forms[0], 2-4 use forms[1], everything else forms[2]
    const lastDigit = n % 10;
    if (lastDigit === 1) return forms[0];
    if (lastDigit >= 2 && lastDigit <= 4) return forms[1];
    return forms[2];
}

export const pluralizeHours = (n) => pluralize(n, ['sat', 'sata', 'sati']);
export const pluralizeMinutes = (n) => pluralize(n, ['minutu', 'minute', 'minuta']);