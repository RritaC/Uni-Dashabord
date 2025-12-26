import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Universities from './pages/Universities';
import UniversityDetail from './pages/UniversityDetail';
import Compare from './pages/Compare';
import Timeline from './pages/Timeline';
import Applications from './pages/Applications';
import Grades from './pages/Grades';
import Documents from './pages/Documents';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/universities" element={<Universities />} />
                    <Route path="/universities/:id" element={<UniversityDetail />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/timeline" element={<Timeline />} />
                    <Route path="/applications" element={<Applications />} />
                    <Route path="/grades" element={<Grades />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;

