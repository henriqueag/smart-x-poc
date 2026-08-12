export function getVisibleDisclaimerCount(
    itemWidths: readonly number[],
    availableWidth: number,
    gap: number
): number {
    let occupiedWidth = 0;
    let visibleCount = 0;

    for (const itemWidth of itemWidths) {
        occupiedWidth += itemWidth + gap;

        if (occupiedWidth > availableWidth) {
            break;
        }

        visibleCount++;
    }

    return visibleCount;
}
