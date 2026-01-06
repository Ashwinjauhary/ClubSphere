import { ClubForm } from '../components/ClubForm';

export const CreateClubPage = () => {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Club</h1>
                <p className="text-gray-500 mt-1">Register a new student organization.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
                <ClubForm />
            </div>
        </div>
    );
};
