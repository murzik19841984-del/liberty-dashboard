import { useState } from 'react';
import { useData } from './hooks/useData';
import { usePeriod } from './hooks/usePeriod';
import { Header } from './components/Header';
import { SectionDDS } from './sections/SectionDDS';
import { SectionOPIU } from './sections/SectionOPIU';
import { SectionAge } from './sections/SectionAge';

export default function App() {
  const [activeSection, setActiveSection] = useState('dds');
  const { rawData, months, loading, error, lastUpdated, refresh } = useData();
  const period = usePeriod(rawData, months);

  const sectionProps = {
    get:          period.get,
    getPrev:      period.getPrev,
    getAgg:       period.getAgg,
    chartBuckets: period.chartBuckets,
    last12months: period.last12months,
    rawData,
    months,
    period,
  };

  return (
    <div>
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        period={period}
        loading={loading}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />

      {loading && (
        <div className="flex items-center justify-center h-96 text-gray-400">
          Загрузка данных…
        </div>
      )}

      {error && (
        <div className="p-8 text-red-500">
          Ошибка загрузки: {error}
          <button onClick={refresh} className="ml-4 underline">Повторить</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {activeSection === 'dds'   && <SectionDDS  {...sectionProps} />}
          {activeSection === 'opiu'  && <SectionOPIU {...sectionProps} />}
          {activeSection === 'age'   && <SectionAge  {...sectionProps} />}
        </>
      )}
    </div>
  );
}
