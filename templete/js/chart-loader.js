/**
 * VELA SYSTEM - Chart Loader
 * 
 * This script ensures Chart.js is properly loaded before any charts are initialized.
 * It checks if Chart.js is already loaded via script tag, and if not, attempts to load it dynamically.
 */

// Create a promise to track when Chart.js is fully loaded
window.chartReadyPromise = new Promise((resolve, reject) => {
    // Check if Chart.js is already loaded
    if (typeof Chart !== 'undefined') {
        console.log('Chart.js already loaded via script tag');

        // Set up global chart defaults
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#1A1A1A';
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;

        resolve(Chart);
        return;
    }

    console.log('Chart.js not found, attempting to load dynamically...');

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
    script.crossOrigin = 'anonymous';

    // Add load and error handlers
    script.onload = () => {
        console.log('Chart.js loaded successfully');

        // Set up global chart defaults
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#1A1A1A';
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;

        resolve(Chart);
    };

    script.onerror = () => {
        console.error('Failed to load Chart.js');

        // Try one more CDN as a fallback
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://unpkg.com/chart.js@3.9.1/dist/chart.min.js';
        fallbackScript.crossOrigin = 'anonymous';

        fallbackScript.onload = () => {
            console.log('Chart.js loaded successfully from fallback CDN');

            // Set up global chart defaults
            Chart.defaults.font.family = "'Inter', sans-serif";
            Chart.defaults.color = '#1A1A1A';
            Chart.defaults.responsive = true;
            Chart.defaults.maintainAspectRatio = false;

            resolve(Chart);
        };

        fallbackScript.onerror = () => {
            console.error('Failed to load Chart.js from fallback CDN');
            reject(new Error('Failed to load Chart.js from all sources'));

            // Show warning to user
            const warningElement = document.createElement('div');
            warningElement.className = 'alert alert-warning';
            warningElement.style.padding = '10px';
            warningElement.style.margin = '10px';
            warningElement.style.backgroundColor = '#fff3cd';
            warningElement.style.color = '#856404';
            warningElement.style.borderRadius = '4px';
            warningElement.textContent = 'Failed to load charting library. Some visualizations may not be available.';
            document.body.prepend(warningElement);
        };

        // Add fallback script to document
        document.head.appendChild(fallbackScript);
    };

    // Add script to document
    document.head.appendChild(script);
});

// Provide a helper function to ensure charts are only created after Chart.js is loaded
window.createChart = async (chartFunction) => {
    try {
        // Wait for Chart.js to be loaded
        await window.chartReadyPromise;

        // Execute the chart creation function
        return chartFunction();
    } catch (error) {
        console.error('Error creating chart:', error);
        return null;
    }
};